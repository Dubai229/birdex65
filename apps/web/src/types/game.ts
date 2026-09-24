// Общие типы игры. Позже переедут в packages/shared, когда появится бэкенд.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type TabId = 'farm' | 'play' | 'chickens' | 'market' | 'shop' | 'events'

export type SheetId = 'reward' | 'rating' | 'friends' | 'settings' | 'chickenPicker' | null

/** Статическое описание породы курицы (конфиг, не данные игрока). */
export interface ChickenDefinition {
  key: string
  name: string
  rarity: Rarity
  price: number
  baseProductionPerHour: number
  baseUpgradeCost: number
  maxLevel: number
  /** Путь к картинке в public/assets/chickens. Пока нет — показываем emoji. */
  asset: string
  emoji: string
}

/** Курица, которой владеет игрок. */
export interface OwnedChicken {
  id: string
  key: string
  level: number
  acquiredAt: number
}

/** Балансы игрока. Числа пока number — на бэкенде будут BIGINT/строки. */
export interface Balance {
  coins: number
  eggs: number
  energy: number
  energyMax: number
  storageCapacity: number
}

export interface PlayerProfile {
  id: string
  name: string
  farmName: string
  level: number
  xp: number
}

export interface RewardState {
  /** Какой день серии заберётся следующим (0..6). */
  streakDay: number
  lastClaimAt: number | null
}

/** Полное состояние сохранения (mock-бэкенд хранит его целиком). */
export interface GameState {
  profile: PlayerProfile
  balance: Balance
  chickens: OwnedChicken[]
  displayedChickenId: string | null
  lastProductionAt: number
  energyUpdatedAt: number
  reward: RewardState
  version: number
}

export interface LeaderboardEntry {
  rank: number
  name: string
  farmValue: number
  isMe?: boolean
}

export interface Friend {
  id: string
  name: string
  active: boolean
}
