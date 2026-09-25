export const CHICKEN_FLIGHT = {
  minAmount: 25,
  maxAmount: 10_000,
  maxMultiplier: 75,
  curvePower: 1.42,
  curveScale: 0.026,
  historyLimit: 8,
} as const

export function flightMultiplierAt(elapsedMs: number): number {
  const seconds = Math.max(0, elapsedMs) / 1000
  const raw = 1 + CHICKEN_FLIGHT.curveScale * seconds ** CHICKEN_FLIGHT.curvePower
  return Math.min(CHICKEN_FLIGHT.maxMultiplier, Math.floor(raw * 100) / 100)
}

export function flightElapsedForMultiplier(multiplier: number): number {
  const m = Math.max(1, Math.min(CHICKEN_FLIGHT.maxMultiplier, multiplier))
  return Math.round(((m - 1) / CHICKEN_FLIGHT.curveScale) ** (1 / CHICKEN_FLIGHT.curvePower) * 1000)
}

export function flightReward(amount: number, multiplier: number): number {
  return Math.floor(Math.max(0, amount) * Math.max(1, multiplier))
}

export function randomCrashMultiplier(): number {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  const r = Math.min(0.999999, Math.max(0.000001, bytes[0] / 2 ** 32))
  const base = 1 / (1 - r * 0.965)
  const capped = Math.min(CHICKEN_FLIGHT.maxMultiplier, Math.max(1.08, base))
  return Math.floor(capped * 100) / 100
}
