import { tg } from './telegram'

let enabled = true

export function setHapticsEnabled(v: boolean): void {
  enabled = v
}

/** Только для важных моментов: сбор, апгрейд, редкая награда. */
export const haptics = {
  light() { if (enabled) tg()?.HapticFeedback?.impactOccurred('light') },
  medium() { if (enabled) tg()?.HapticFeedback?.impactOccurred('medium') },
  success() { if (enabled) tg()?.HapticFeedback?.notificationOccurred('success') },
  error() { if (enabled) tg()?.HapticFeedback?.notificationOccurred('error') },
}
