export const SEASON_DAYS = 120
export const SEASON_MS = SEASON_DAYS * 24 * 60 * 60 * 1000

/** Сколько проданных яиц дают 1 BIRD Point. */
export const EGGS_PER_BIRD_POINT = 100

/**
 * BIRD Points за продажу: 1 очко за каждые 100 проданных яиц.
 * Считаем от общего числа проданных яиц, поэтому остаток не теряется:
 * продал 60, потом 40 — на второй продаже придёт 1 очко.
 */
export function birdPointsForSale(soldBefore: number, soldNow: number): number {
  return Math.floor(soldNow / EGGS_PER_BIRD_POINT) - Math.floor(soldBefore / EGGS_PER_BIRD_POINT)
}

export function seasonRank(points: number): number {
  return Math.max(1, Math.floor(12000 / (1 + points / 1500)) + 421)
}

export function seasonTopPercent(rank: number): number {
  return Math.max(0.1, Math.min(99.9, (rank / 90000) * 100))
}

export function formatSeasonLeft(ms: number): string {
  const totalHours = Math.max(0, Math.floor(ms / 3_600_000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return `${days}d ${hours}h`
}
