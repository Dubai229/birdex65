// Создание и "тик" состояния для mock-сервера.

import { ECONOMY } from '@/config/economy'
import { STARTER_CHICKEN_KEY } from '@/config/chickens'
import { farmProductionPerHour, storageCapacityFor } from '@/economy/production'
import { currentEnergy, energyMaxForLevel } from '@/economy/energy'
import type { GameState } from '@/types/game'
import { getTelegramUser } from './telegram'

/** v2: 36 куриц, 15 уровней, энергия 300 + прокачка. Старые сохранения сбрасываются. */
export const SAVE_VERSION = 2

export function createNewState(now: number): GameState {
  const tg = getTelegramUser()
  const starterId = `c_${now}`
  const state: GameState = {
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
      energy: ECONOMY.energy.start,
      energyMax: ECONOMY.energy.start,
      storageCapacity: ECONOMY.minStorageCapacity,
    },
    chickens: [{ id: starterId, key: STARTER_CHICKEN_KEY, level: 1, acquiredAt: now }],
    displayedChickenId: starterId,
    energyLevel: 0,
    lastProductionAt: now,
    energyUpdatedAt: now,
    reward: { streakDay: 0, lastClaimAt: null },
    version: SAVE_VERSION,
  }
  syncDerived(state)
  return state
}

/** Пересчитать то, что зависит от куриц и прокачки: склад и максимум энергии. */
export function syncDerived(state: GameState): void {
  state.balance.storageCapacity = storageCapacityFor(farmProductionPerHour(state.chickens))
  state.balance.energyMax = energyMaxForLevel(state.energyLevel)
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
