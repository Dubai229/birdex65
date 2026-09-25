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
import { energyUpgradeCost, ENERGY_MAX_LEVEL } from '@/economy/energy'
import type { GameState } from '@/types/game'
import { ApiError, type GameApi, type PlaySessionTicket } from './apiTypes'
import { loadSave, writeSave } from './storage'
import { createNewState, syncEnergy, syncDerived, addXp, clone, SAVE_VERSION } from './mockState'
import { mockLeaderboard, mockFriends } from './mockSocial'

const LATENCY_MS = 120
const wait = () => new Promise((r) => setTimeout(r, LATENCY_MS))

let state: GameState | null = null
let activeSession: Omit<PlaySessionTicket, 'state'> | null = null

function db(): GameState {
  if (!state) {
    const saved = loadSave<GameState>()
    state = saved && saved.version === SAVE_VERSION ? saved : createNewState(Date.now())
    syncDerived(state)
  }
  return state
}

function commit(): GameState {
  writeSave(db())
  return clone(db())
}

function farmValue(s: GameState): number {
  return s.balance.coins + s.chickens.reduce((a, c) => a + getChickenDef(c.key).price, 0)
}

export const mockApi: GameApi = {
  async me() {
    await wait()
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
    addXp(s, Math.ceil(collected / 20))
    return { collected, state: commit() }
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
    addXp(s, Math.ceil(eggs / 25))
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
    addXp(s, 50)
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
    addXp(s, 25)
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
    s.balance.energy = Math.min(s.balance.energyMax, s.balance.energy + ECONOMY.energy.upgradeStep)
    return commit()
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
    const raw =
      summary.normalCaught * ECONOMY.play.normalReward +
      summary.goldenCaught * ECONOMY.play.goldenReward
    const free = Math.max(0, s.balance.storageCapacity - s.balance.eggs)
    const eggsAwarded = Math.max(0, Math.min(Math.floor(raw * ratio), free))
    s.balance.eggs += eggsAwarded
    addXp(s, Math.ceil(eggsAwarded / 10))
    return { eggsAwarded, state: commit() }
  },

  async leaderboard() {
    await wait()
    const s = db()
    return mockLeaderboard(s.profile.name, farmValue(s))
  },

  async friends() {
    await wait()
    return mockFriends()
  },

  async renameFarm(name) {
    await wait()
    const clean = name.trim().slice(0, 24)
    if (!clean) throw new ApiError('BAD_NAME')
    db().profile.farmName = clean
    return commit()
  },
}
