import { ECONOMY } from '@/config/economy'
import type { RewardState } from '@/types/game'

const HOUR_MS = 3_600_000

export type RewardStatus = 'ready' | 'wait'

export function rewardStatus(state: RewardState, now: number): RewardStatus {
  if (state.lastClaimAt === null) return 'ready'
  return now - state.lastClaimAt >= ECONOMY.rewardCooldownHours * HOUR_MS ? 'ready' : 'wait'
}

/** Сколько мс до следующей награды. */
export function msUntilReward(state: RewardState, now: number): number {
  if (state.lastClaimAt === null) return 0
  return Math.max(0, state.lastClaimAt + ECONOMY.rewardCooldownHours * HOUR_MS - now)
}

/** День серии, который будет выдан (сбрасывается, если пропустил слишком долго). */
export function effectiveStreakDay(state: RewardState, now: number): number {
  if (state.lastClaimAt === null) return 0
  const missed = now - state.lastClaimAt > ECONOMY.rewardResetHours * HOUR_MS
  return missed ? 0 : state.streakDay
}

export function rewardAmount(day: number): number {
  const list = ECONOMY.rewardStreak
  return list[Math.min(day, list.length - 1)]
}
