import { ECONOMY } from '@/config/economy'
import { getChickenDef } from '@/config/chickens'
import { niceRound } from './round'

/** upgradeCost = baseCost × growth^(level − 1), округлено красиво */
export function upgradeCost(key: string, level: number): number {
  const def = getChickenDef(key)
  return niceRound(def.baseUpgradeCost * ECONOMY.upgradeGrowth ** (level - 1))
}

export function canUpgrade(key: string, level: number, coins: number): boolean {
  const def = getChickenDef(key)
  return level < def.maxLevel && coins >= upgradeCost(key, level)
}

export function isMaxLevel(key: string, level: number): boolean {
  return level >= getChickenDef(key).maxLevel
}
