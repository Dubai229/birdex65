// Единый список ассетов. Кладёшь файл в public/assets/... — прописываешь путь тут.
// Пока файла нет, компоненты показывают emoji-заглушку.

export const ASSETS = {
  farm: {
    background: '/assets/farm/background.webp',
    barn: '/assets/farm/barn.png',
  },
  eggs: {
    normal: '/assets/eggs/egg.png',
    golden: '/assets/eggs/egg_golden.png',
    basket: '/assets/eggs/basket.png',
  },
  ui: {
    coin: '/assets/ui/coin.png',
    egg: '/assets/ui/egg_icon.png',
    energy: '/assets/ui/energy.png',
  },
} as const

/** Звуки: public/audio/sfx/*.mp3 и public/audio/music/*.mp3 */
export const SOUNDS = {
  eggCatch: '/audio/sfx/egg_catch.mp3',
  eggGolden: '/audio/sfx/egg_golden.mp3',
  collect: '/audio/sfx/collect.mp3',
  coins: '/audio/sfx/coins.mp3',
  sell: '/audio/sfx/sell.mp3',
  upgrade: '/audio/sfx/upgrade.mp3',
  buy: '/audio/sfx/buy.mp3',
  reward: '/audio/sfx/reward.mp3',
  cluck: '/audio/sfx/cluck.mp3',
  click: '/audio/sfx/click.mp3',
} as const

export const MUSIC = {
  farm: '/audio/music/farm_theme.mp3',
  play: '/audio/music/play_theme.mp3',
} as const

export type SoundId = keyof typeof SOUNDS
export type MusicId = keyof typeof MUSIC
