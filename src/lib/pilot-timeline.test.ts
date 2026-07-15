import { describe, it, expect } from 'vitest'
import { pilotTimelineFor } from './pilot-timeline'

describe('pilotTimelineFor', () => {
  it('returns empty for a malformed month string', () => {
    expect(pilotTimelineFor('not-a-month')).toEqual([])
    expect(pilotTimelineFor('')).toEqual([])
  })

  it('lays out setup two months before the target', () => {
    const [setup] = pilotTimelineFor('2026-10')
    expect(setup.offset).toBe(-2)
    expect(setup.monthKey).toBe('2026-08')
    expect(setup.monthLabel).toBe('August 2026')
  })

  it('puts the first distribution in the target month itself', () => {
    const milestones = pilotTimelineFor('2026-10')
    const first = milestones.find((m) => m.offset === 0)!
    expect(first.monthKey).toBe('2026-10')
    expect(first.monthLabel).toBe('October 2026')
  })

  it('rolls the year over when the target month is January', () => {
    const [setup] = pilotTimelineFor('2027-01')
    expect(setup.monthKey).toBe('2026-11')
    expect(setup.monthLabel).toBe('November 2026')
  })

  it('rolls the year forward for the scale-decision milestone near December', () => {
    const milestones = pilotTimelineFor('2026-11')
    const scaleDecision = milestones.find((m) => m.offset === 3)!
    expect(scaleDecision.monthKey).toBe('2027-02')
    expect(scaleDecision.monthLabel).toBe('February 2027')
  })

  it('includes every milestone from setup through scale decision', () => {
    const offsets = pilotTimelineFor('2026-06').map((m) => m.offset)
    expect(offsets).toEqual([-2, 0, 1, 2, 3])
  })
})
