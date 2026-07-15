import { describe, it, expect } from 'vitest'
import { volunteerRosterFor } from './volunteer-calculator'

describe('volunteerRosterFor', () => {
  it('matches the playbook anchor for the rural pilot tier', () => {
    const r = volunteerRosterFor(20)
    expect(r.weeklyPickups).toBe(2)
    expect(r.stockingDay).toBe(2)
    expect(r.distributionDay).toBe(4)
    expect(r.totalRoster).toBe(7)
  })

  it('matches the playbook anchor for the mid tier', () => {
    const r = volunteerRosterFor(37.5)
    expect(r.totalRoster).toBe(11)
  })

  it('matches the playbook anchor for the largest tier', () => {
    const r = volunteerRosterFor(75)
    expect(r.weeklyPickups).toBe(4)
    expect(r.stockingDay).toBe(4)
    expect(r.distributionDay).toBe(11)
    expect(r.totalRoster).toBe(16)
  })

  it('interpolates between tiers', () => {
    const low = volunteerRosterFor(20)
    const mid = volunteerRosterFor(28)
    const high = volunteerRosterFor(37.5)
    expect(mid.totalRoster).toBeGreaterThanOrEqual(low.totalRoster)
    expect(mid.totalRoster).toBeLessThanOrEqual(high.totalRoster)
  })

  const withoutHouseholds = (r: ReturnType<typeof volunteerRosterFor>) => ({
    weeklyPickups: r.weeklyPickups,
    stockingDay: r.stockingDay,
    distributionDay: r.distributionDay,
    totalRoster: r.totalRoster,
  })

  it('clamps below the smallest tier instead of extrapolating', () => {
    expect(withoutHouseholds(volunteerRosterFor(5))).toEqual(withoutHouseholds(volunteerRosterFor(20)))
  })

  it('clamps above the largest tier instead of extrapolating', () => {
    expect(withoutHouseholds(volunteerRosterFor(500))).toEqual(withoutHouseholds(volunteerRosterFor(75)))
  })

  it('treats zero/negative input as at least 1 household', () => {
    expect(volunteerRosterFor(0).householdsPerMonth).toBe(1)
    expect(volunteerRosterFor(-10).householdsPerMonth).toBe(1)
  })
})
