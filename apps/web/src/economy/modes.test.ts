import { describe, it, expect } from 'vitest'
import { foxEggs, runEggs, foxDifficulty, runDifficulty, modeEnergyNow } from './modes'
import { ECONOMY } from '@/config/economy'

describe('режимы Play', () => {
  it('лисы: 1 яйцо за обычную, 5 за плотную', () => {
    expect(foxEggs(10, 0)).toBe(10)
    expect(foxEggs(3, 2)).toBe(13)
  })

  it('бомбы: 20 яиц в минуту, 10 минут — 500', () => {
    expect(runEggs(0)).toBe(0)
    expect(runEggs(30)).toBe(10)
    expect(runEggs(60)).toBe(20)
    expect(runEggs(599)).toBe(199)
    expect(runEggs(600)).toBe(500)
  })

  it('лисы ускоряются и к концу "адские"', () => {
    const early = foxDifficulty(0)
    const late = foxDifficulty(180)
    expect(late.speed).toBeGreaterThan(early.speed * 3)
    expect(late.spawnGap).toBeLessThan(0.4)
    expect(late.tankChance).toBeCloseTo(ECONOMY.modes.fox.tankChanceMax)
  })

  it('бомбы ускоряются мягко и упираются в предел', () => {
    const late = runDifficulty(600)
    expect(late.fall).toBeLessThanOrEqual(ECONOMY.modes.run.fallMax)
    expect(late.spawnGap).toBeGreaterThanOrEqual(ECONOMY.modes.run.spawnMin)
  })

  it('энергия режима восстанавливается целиком за 8 часов', () => {
    const now = 1_000_000
    expect(modeEnergyNow({ energy: 0, updatedAt: now }, now + 8 * 3_600_000)).toBe(300)
    expect(modeEnergyNow({ energy: 0, updatedAt: now, level: 2 }, now + 4 * 3_600_000)).toBe(200)
    expect(modeEnergyNow({ energy: 0, updatedAt: now, level: 14 }, now + 8 * 3_600_000)).toBe(1000)
  })
})
