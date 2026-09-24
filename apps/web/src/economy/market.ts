import { ECONOMY } from '@/config/economy'

/** coinsReceived = eggsSold * price */
export function sellValue(eggs: number, price: number = ECONOMY.eggSellPrice): number {
  return Math.max(0, Math.floor(eggs)) * price
}

/** Доля от склада (25% / 50% / MAX). */
export function eggsForPercent(total: number, percent: number): number {
  return Math.floor((total * Math.min(100, Math.max(0, percent))) / 100)
}

export function clampSellAmount(amount: number, total: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.max(0, Math.min(Math.floor(amount), total))
}
