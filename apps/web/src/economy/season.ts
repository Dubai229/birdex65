export const SEASON_DAYS = 120
export const SEASON_MS = SEASON_DAYS * 24 * 60 * 60 * 1000

export function birdPointsForCollect(eggs: number): number {
  return eggs > 0 ? Math.max(1, Math.ceil(eggs / 100)) : 0
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
