import { CHICKENS } from '@/config/chickens'
import { ECONOMY } from '@/config/economy'

export function autoAvatarKey(level: number): string {
  const clamped = Math.max(1, Math.min(ECONOMY.player.maxLevel, Math.floor(level)))
  const index = Math.min(
    CHICKENS.length - 1,
    Math.floor(((clamped - 1) / Math.max(1, ECONOMY.player.maxLevel - 1)) * CHICKENS.length),
  )
  return CHICKENS[index]?.key ?? 'farm_hen'
}
