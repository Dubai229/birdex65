// Создание и "тик" состояния для mock-сервера.

import { ECONOMY } from '@/config/economy'
import { STARTER_CHICKEN_KEY } from '@/config/chickens'
import { currentEnergy } from '@/economy/production'
import type { GameState } from '@/types/game'
import { getTelegramUser } from './telegram'

export const SAVE_VERSION = 1

export function createNewState(now: number): GameState {
  const tg = getTelegramUser()
  const starterId = `c_${now}`
  return {
    profile: {
      id: tg?.id ? String(tg.id) : 'local',
      name: tg?.first_name ?? 'Фермер',
      farmName: 'Моя ферма',
      level: 1,
      xp: 0,
    },
    balance: {
      coins: ECONOMY.startCoins,
      eggs: 0,
      energy: ECONOMY.energy.max,
      energyMax: ECONOMY.energy.max,
      storageCapacity: ECONOMY.startStorageCapacity,
    },
    chickens: [{ id: starterId, key: STARTER_CHICKEN_KEY, level: 1, acquiredAt: now }],
    displayedChickenId: starterId,
    lastProductionAt: now,
    energyUpdatedAt: now,
    reward: { streakDay: 0, lastClaimAt: null },
    version: SAVE_VERSION,
  }
}

/** Применяет восстановление энергии к состоянию. */
export function syncEnergy(state: GameState, now: number): void {
  state.balance.energy = currentEnergy({
    energy: state.balance.energy,
    energyMax: state.balance.energyMax,
    energyUpdatedAt: state.energyUpdatedAt,
    now,
  })
  state.energyUpdatedAt = now
}

export function addXp(state: GameState, amount: number): void {
  state.profile.xp += amount
  while (state.profile.xp >= xpForLevel(state.profile.level)) {
    state.profile.xp -= xpForLevel(state.profile.level)
    state.profile.level += 1
  }
}

export function xpForLevel(level: number): number {
  return 100 + level * 50
}

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
