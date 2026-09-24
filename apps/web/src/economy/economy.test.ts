import { describe, it, expect } from 'vitest'
import { chickenProduction, accumulatedEggs, currentEnergy } from './production'
import { upgradeCost } from './upgrade'
import { sellValue, eggsForPercent, clampSellAmount } from './market'
import { rewardStatus, effectiveStreakDay, rewardAmount } from './reward'
import { comboMultiplier } from './combo'

const H = 3_600_000

describe('production', () => {
  it('level 1 = base production', () => {
    expect(chickenProduction('farm_hen', 1)).toBe(12)
  })
  it('grows with level', () => {
    expect(chickenProduction('farm_hen', 5)).toBeGreaterThan(12)
  })
  it('offline cap is 8 hours', () => {
    const eggs = accumulatedEggs({
      perHour: 100, lastProductionAt: 0, now: 24 * H, eggsInStorage: 0, storageCapacity: 1e9,
    })
    expect(eggs).toBe(800)
  })
  it('respects storage capacity', () => {
    const eggs = accumulatedEggs({
      perHour: 100, lastProductionAt: 0, now: 8 * H, eggsInStorage: 950, storageCapacity: 1000,
    })
    expect(eggs).toBe(50)
  })
  it('never negative when clock goes back', () => {
    const eggs = accumulatedEggs({
      perHour: 100, lastProductionAt: 10 * H, now: 0, eggsInStorage: 0, storageCapacity: 1000,
    })
    expect(eggs).toBe(0)
  })
  it('energy regen is capped', () => {
    expect(currentEnergy({ energy: 900, energyMax: 1000, energyUpdatedAt: 0, now: 99 * H })).toBe(1000)
  })
})

describe('upgrade', () => {
  it('level 1 cost = base cost', () => {
    expect(upgradeCost('farm_hen', 1)).toBe(250)
  })
  it('cost grows', () => {
    expect(upgradeCost('farm_hen', 2)).toBeGreaterThan(250)
  })
})

describe('market', () => {
  it('sell value', () => {
    expect(sellValue(100, 5)).toBe(500)
    expect(sellValue(-5, 5)).toBe(0)
  })
  it('percent and clamp', () => {
    expect(eggsForPercent(1248, 25)).toBe(312)
    expect(clampSellAmount(5000, 1248)).toBe(1248)
    expect(clampSellAmount(NaN, 10)).toBe(0)
  })
})

describe('reward', () => {
  it('ready on first claim', () => {
    expect(rewardStatus({ streakDay: 0, lastClaimAt: null }, 0)).toBe('ready')
  })
  it('waits cooldown', () => {
    expect(rewardStatus({ streakDay: 1, lastClaimAt: 0 }, 1 * H)).toBe('wait')
  })
  it('streak resets after long break', () => {
    expect(effectiveStreakDay({ streakDay: 4, lastClaimAt: 0 }, 72 * H)).toBe(0)
  })
  it('amount clamps to last day', () => {
    expect(rewardAmount(99)).toBe(2000)
  })
})

describe('combo', () => {
  it('steps up', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(5)).toBe(2)
    expect(comboMultiplier(100)).toBe(5)
  })
})
