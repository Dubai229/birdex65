import type { ChickenDefinition, Rarity } from '@/types/game'

// Стартовый набор из 6 куриц (спек: не больше ~6 на старте).
export const CHICKENS: ChickenDefinition[] = [
  {
    key: 'farm_hen', name: 'Обычная', rarity: 'common',
    price: 0, baseProductionPerHour: 12, baseUpgradeCost: 250, maxLevel: 20,
    asset: '/assets/chickens/farm_hen.png', emoji: '🐔',
  },
  {
    key: 'red_hen', name: 'Рыжая', rarity: 'common',
    price: 2_500, baseProductionPerHour: 45, baseUpgradeCost: 800, maxLevel: 20,
    asset: '/assets/chickens/red_hen.png', emoji: '🐓',
  },
  {
    key: 'speckled_hen', name: 'Пятнистая', rarity: 'uncommon',
    price: 9_000, baseProductionPerHour: 80, baseUpgradeCost: 2_000, maxLevel: 20,
    asset: '/assets/chickens/speckled_hen.png', emoji: '🐔',
  },
  {
    key: 'black_hen', name: 'Чёрная', rarity: 'rare',
    price: 25_000, baseProductionPerHour: 150, baseUpgradeCost: 5_000, maxLevel: 20,
    asset: '/assets/chickens/black_hen.png', emoji: '🐦‍⬛',
  },
  {
    key: 'farmer_hen', name: 'Фермерская', rarity: 'epic',
    price: 70_000, baseProductionPerHour: 320, baseUpgradeCost: 12_000, maxLevel: 20,
    asset: '/assets/chickens/farmer_hen.png', emoji: '🤠',
  },
  {
    key: 'golden_hen', name: 'Золотая', rarity: 'legendary',
    price: 250_000, baseProductionPerHour: 1_200, baseUpgradeCost: 40_000, maxLevel: 20,
    asset: '/assets/chickens/golden_hen.png', emoji: '👑',
  },
]

export const STARTER_CHICKEN_KEY = 'farm_hen'

export function getChickenDef(key: string): ChickenDefinition {
  const def = CHICKENS.find((c) => c.key === key)
  if (!def) throw new Error(`Unknown chicken: ${key}`)
  return def
}

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
