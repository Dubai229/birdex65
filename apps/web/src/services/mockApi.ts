// Mock-сервер: живёт в браузере, но ведёт себя как настоящий бэкенд —
// принимает намерение, валидирует, считает результат сам.
// Когда появится apps/api, заменяется на httpApi.ts без правок в UI.

import { ECONOMY } from '@/config/economy'
import { getChickenDef } from '@/config/chickens'
import { accumulatedEggs, farmProductionPerHour } from '@/economy/production'
import { upgradeCost, isMaxLevel } from '@/economy/upgrade'
import { sellValue } from '@/economy/market'
import { rewardStatus, effectiveStreakDay, rewardAmount } from '@/economy/reward'
import { maxPlausibleEggs } from '@/economy/playDifficulty'
import { energyBuyCost, energyUpgradeCost, ENERGY_MAX_LEVEL } from '@/economy/energy'
import { storageUpgradeCost, STORAGE_MAX_LEVEL } from '@/economy/storage'
import { birdPointsForCollect } from '@/economy/season'
import { findPromo, normalizeCode } from '@/config/promo'
import type { GameState } from '@/types/game'
import { ApiError, type GameApi, type PlaySessionTicket } from './apiTypes'
import { loadSave, writeSave } from './storage'
import { createNewState, syncEnergy, syncDerived, addXp, clone, SAVE_VERSION } from './mockState'
import { cloudEnabled, cloudLogin, cloudSave, cloudLeaderboard, cloudFriends, cloudClaimReferral, cloudChannelCheck, cloudChannelClaim } from './cloud'
import { setSaveOwner } from './storage'
import { getTelegramUser } from './telegram'

const LATENCY_MS = 120
const wait = () => new Promise((r) => setTimeout(r, LATENCY_MS))

let state: GameState | null = null

/** Сколько стоит следующая смена названия фермы. */
export function renameCost(s: Pick<GameState, 'profile'>): number {
  return (s.profile.renames ?? 0) >= 1 ? ECONOMY.renameCost : 0
}
let activeSession: Omit<PlaySessionTicket, 'state'> | null = null

let booted: Promise<void> | null = null

/** Сохранение с сервера похоже на настоящее (защита от битых/чужих данных). */
function isValidState(s: unknown): s is GameState {
  const g = s as GameState | null
  return (
    !!g &&
    g.version === SAVE_VERSION &&
    typeof g.balance?.coins === 'number' &&
    typeof g.profile?.xp === 'number' &&
    Array.isArray(g.chickens) &&
    g.chickens.length > 0 &&
    g.chickens.every((c) => typeof c?.key === 'string' && typeof c?.level === 'number')
  )
}

/**
 * Первый запуск: в Telegram входим на сервер и берём прогресс оттуда.
 * Нет сервера / не Telegram — локальное сохранение этого устройства.
 */
function boot(): Promise<void> {
  if (booted) return booted
  booted = (async () => {
    const tgUser = getTelegramUser()
    setSaveOwner(tgUser ? String(tgUser.id) : null)
    if (cloudEnabled()) {
      try {
        const res = await cloudLogin()
        if (isValidState(res.state)) {
          state = res.state
          syncDerived(state)
        }
      } catch {
        /* сервер недоступен — играем локально, сохраним позже */
      }
    }
    const s = db()
    if (tgUser) {
      s.profile.id = String(tgUser.id)
      s.profile.name = tgUser.first_name || s.profile.name
    }
    commit()
  })()
  return booted
}

function db(): GameState {
  if (!state) {
    const saved = loadSave<GameState>()
    state = isValidState(saved) ? saved : createNewState(Date.now())
    syncDerived(state)
  }
  return state
}

function commit(): GameState {
  writeSave(db())
  cloudSave(db())
  return clone(db())
}

export const mockApi: GameApi = {
  async me() {
    await boot()
    await wait()
    syncDerived(db())
    syncEnergy(db(), Date.now())
    return commit()
  },

  async collect() {
    await wait()
    const s = db()
    const now = Date.now()
    const collected = accumulatedEggs({
      perHour: farmProductionPerHour(s.chickens),
      lastProductionAt: s.lastProductionAt,
      now,
      eggsInStorage: s.balance.eggs,
      storageCapacity: s.balance.storageCapacity,
    })
    s.balance.eggs += collected
    s.lastProductionAt = now
    const birdPointsAwarded = birdPointsForCollect(collected)
    s.season.points += birdPointsAwarded
    return { collected, birdPointsAwarded, state: commit() }
  },

  async sellEggs(amount) {
    await wait()
    const s = db()
    const eggs = Math.floor(amount)
    if (eggs <= 0) throw new ApiError('BAD_AMOUNT')
    if (eggs > s.balance.eggs) throw new ApiError('NOT_ENOUGH_EGGS')
    const coins = sellValue(eggs)
    s.balance.eggs -= eggs
    s.balance.coins += coins
    s.stats.soldCoins += coins // с этого пригласившему идёт 12%
    return { eggsSold: eggs, coinsReceived: coins, state: commit() }
  },

  async buyChicken(key) {
    await wait()
    const s = db()
    const def = getChickenDef(key)
    if (s.chickens.some((c) => c.key === key)) throw new ApiError('ALREADY_OWNED')
    if (s.balance.coins < def.price) throw new ApiError('NOT_ENOUGH_COINS')
    // Сначала собираем накопленное по старой ставке.
    await mockApi.collect()
    s.balance.coins -= def.price
    s.chickens.push({ id: `c_${Date.now()}`, key, level: 1, acquiredAt: Date.now() })
    syncDerived(s)
    addXp(s, def.price)
    return commit()
  },

  async upgradeChicken(chickenId) {
    await wait()
    const s = db()
    const chicken = s.chickens.find((c) => c.id === chickenId)
    if (!chicken) throw new ApiError('NOT_FOUND')
    if (isMaxLevel(chicken.key, chicken.level)) throw new ApiError('MAX_LEVEL')
    const cost = upgradeCost(chicken.key, chicken.level)
    if (s.balance.coins < cost) throw new ApiError('NOT_ENOUGH_COINS')
    // Сначала собираем накопленное по старой ставке, чтобы не потерять/не удвоить яйца.
    await mockApi.collect()
    s.balance.coins -= cost
    chicken.level += 1
    syncDerived(s)
    addXp(s, cost)
    return commit()
  },

  async upgradeEnergy() {
    await wait()
    const s = db()
    if (s.energyLevel >= ENERGY_MAX_LEVEL) throw new ApiError('MAX_LEVEL')
    const cost = energyUpgradeCost(s.energyLevel)
    if (s.balance.coins < cost) throw new ApiError('NOT_ENOUGH_COINS')
    syncEnergy(s, Date.now())
    s.balance.coins -= cost
    s.energyLevel += 1
    syncDerived(s)
    // +50 к максимуму сразу добавляет и +50 к текущей энергии
    // бонусная энергия сверх максимума не срезается
    s.balance.energy = Math.max(s.balance.energy, Math.min(s.balance.energyMax, s.balance.energy + ECONOMY.energy.upgradeStep))
    return commit()
  },

  async buyEnergy() {
    await wait()
    const s = db()
    const cost = energyBuyCost(s.profile.level)
    if (s.balance.coins < cost) throw new ApiError('NOT_ENOUGH_COINS')
    syncEnergy(s, Date.now())
    s.balance.coins -= cost
    // Купленная энергия может быть выше максимума, как бонусы из промокодов.
    s.balance.energy += ECONOMY.energy.buyAmount
    return { energy: ECONOMY.energy.buyAmount, coinsSpent: cost, state: commit() }
  },

  async upgradeStorage() {
    await wait()
    const s = db()
    if (s.storageLevel >= STORAGE_MAX_LEVEL) throw new ApiError('MAX_LEVEL')
    const cost = storageUpgradeCost(s.storageLevel)
    if (s.balance.coins < cost) throw new ApiError('NOT_ENOUGH_COINS')
    // Сначала собираем то, что упёрлось в старый склад.
    await mockApi.collect()
    s.balance.coins -= cost
    s.storageLevel += 1
    syncDerived(s)
    return commit()
  },

  async redeemCode(raw) {
    await wait()
    const s = db()
    const promo = findPromo(raw)
    if (!promo) throw new ApiError('CODE_INVALID')
    const code = normalizeCode(raw)
    if (s.redeemedCodes.includes(code)) throw new ApiError('CODE_USED')
    s.redeemedCodes.push(code)
    const coins = promo.coins ?? 0
    const energy = promo.energy ?? 0
    s.balance.coins += coins
    if (energy > 0) {
      syncEnergy(s, Date.now())
      s.balance.energy += energy
    }
    return { coins, energy, state: commit() }
  },

  async displayChicken(chickenId) {
    await wait()
    const s = db()
    if (!s.chickens.some((c) => c.id === chickenId)) throw new ApiError('NOT_FOUND')
    s.displayedChickenId = chickenId
    return commit()
  },

  async claimReward() {
    await wait()
    const s = db()
    const now = Date.now()
    if (rewardStatus(s.reward, now) !== 'ready') throw new ApiError('REWARD_NOT_READY')
    const day = effectiveStreakDay(s.reward, now)
    const coins = rewardAmount(day)
    s.balance.coins += coins
    s.reward = { streakDay: (day + 1) % ECONOMY.rewardStreak.length, lastClaimAt: now }
    return { coins, day, state: commit() }
  },

  async startPlay() {
    await wait()
    const s = db()
    const now = Date.now()
    syncEnergy(s, now)
    if (s.balance.energy < ECONOMY.energy.playCost) throw new ApiError('NO_ENERGY')
    // Энергия списывается сразу за попытку (50% стартового запаса).
    s.balance.energy -= ECONOMY.energy.playCost
    activeSession = {
      sessionId: `s_${now}`,
      startedAt: now,
      expiresAt: now + ECONOMY.play.maxSessionMinutes * 60_000,
    }
    return { ...activeSession, state: commit() }
  },

  async finishPlay(summary) {
    await wait()
    const s = db()
    const session = activeSession
    if (!session || session.sessionId !== summary.sessionId) throw new ApiError('BAD_SESSION')
    activeSession = null // идемпотентность: второй finish той же сессии не пройдёт
    const now = Date.now()
    const duration = Math.min(now, session.expiresAt) - session.startedAt
    const caught = summary.normalCaught + summary.goldenCaught
    const plausible = maxPlausibleEggs(duration)
    const ratio = caught > 0 ? Math.min(1, plausible / caught) : 0
    const maxEarned = summary.normalCaught * 2 + summary.goldenCaught * ECONOMY.play.goldenReward
    const raw = Math.max(0, Math.min(Math.floor(summary.eggsEarned), maxEarned))
    const free = Math.max(0, s.balance.storageCapacity - s.balance.eggs)
    const earned = Math.floor(raw * ratio)
    const eggsAwarded = Math.max(0, Math.min(earned, free))
    s.balance.eggs += eggsAwarded
    // Рекорд для рейтинга — сколько набил за игру (даже если склад не вместил).
    s.stats.bestPlay = Math.max(s.stats.bestPlay, earned)
    return { eggsAwarded, state: commit() }
  },

  async leaderboard(kind) {
    if (!cloudEnabled()) return { top: [], me: null, online: false }
    const res = await cloudLeaderboard(kind)
    return { ...res, online: true }
  },

  async friends() {
    if (!cloudEnabled()) return { friends: [], pending: 0, total: 0, online: false }
    return { ...(await cloudFriends()), online: true }
  },

  async claimReferral() {
    if (!cloudEnabled()) throw new ApiError('OFFLINE')
    const coins = await cloudClaimReferral()
    const s = db()
    s.balance.coins += coins // не считается продажей — 12% с 12% не бывает
    return { coins, state: commit() }
  },

  // Подписку на канал проверяет сервер (спрашивает Telegram), он же выдаёт бонус один раз.
  // Вне Telegram (обычный браузер) — упрощённая проверка для теста.
  async verifyChannelSubscription() {
    const s = db()
    if (cloudEnabled()) {
      const res = await cloudChannelCheck()
      s.events.channelSubscribed = res.subscribed
      if (res.claimed) s.events.channelBonusClaimed = true
      commit()
      if (!res.subscribed) throw new ApiError('CHANNEL_NOT_SUBSCRIBED')
      return { subscribed: true, state: clone(s) }
    }
    await wait()
    s.events.channelSubscribed = true
    return { subscribed: true, state: commit() }
  },

  async claimChannelBonus() {
    const s = db()
    if (s.events.channelBonusClaimed) throw new ApiError('CHANNEL_BONUS_CLAIMED')
    let coins = 1000
    if (cloudEnabled()) {
      try {
        coins = (await cloudChannelClaim()).coins
      } catch (e) {
        // Сервер говорит "уже забран" — запоминаем, чтобы кнопка больше не предлагала.
        if (e instanceof ApiError && e.code === 'CHANNEL_BONUS_CLAIMED') {
          s.events.channelBonusClaimed = true
          commit()
        }
        if (e instanceof ApiError && e.code === 'CHANNEL_NOT_SUBSCRIBED') {
          s.events.channelSubscribed = false
          commit()
        }
        throw e
      }
    } else {
      await wait()
      if (!s.events.channelSubscribed) throw new ApiError('CHANNEL_NOT_SUBSCRIBED')
    }
    s.events.channelBonusClaimed = true
    s.balance.coins += coins
    return { coins, state: commit() }
  },

  async renameFarm(name) {
    await wait()
    const clean = name.trim().slice(0, 24)
    if (!clean) throw new ApiError('BAD_NAME')
    const s = db()
    if (clean === s.profile.farmName) return commit() // то же имя — ничего не списываем
    // Первая смена бесплатная, дальше — ECONOMY.renameCost монет.
    const cost = renameCost(s)
    if (s.balance.coins < cost) throw new ApiError('NOT_ENOUGH_COINS')
    s.balance.coins -= cost
    s.profile.farmName = clean
    s.profile.renames = (s.profile.renames ?? 0) + 1
    return commit()
  },
}
