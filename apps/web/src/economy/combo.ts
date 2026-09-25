import { ECONOMY } from '@/config/economy'

/** Множитель комбо по числу пойманных подряд яиц (пока только визуально). */
export function comboMultiplier(streak: number): number {
  const steps = ECONOMY.play.comboSteps
  const idx = Math.min(steps.length - 1, Math.floor(streak / ECONOMY.play.comboEvery))
  return steps[idx]
}
