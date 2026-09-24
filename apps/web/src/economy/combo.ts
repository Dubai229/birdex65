import { ECONOMY } from '@/config/economy'

/** Множитель комбо по числу пойманных подряд яиц. */
export function comboMultiplier(streak: number): number {
  const steps = ECONOMY.play.comboSteps
  const idx = Math.min(steps.length - 1, Math.floor(streak / ECONOMY.play.comboEvery))
  return steps[idx]
}

/** Анти-чит: максимум яиц, которые реально поймать за сессию данной длины. */
export function maxPlausibleEggs(durationMs: number): number {
  return Math.ceil((durationMs / 1000) * ECONOMY.play.maxEggsPerSecond)
}
