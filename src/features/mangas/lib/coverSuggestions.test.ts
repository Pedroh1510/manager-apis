import { describe, expect, it } from 'vitest'
import { groupByManga, scorePercent } from './coverSuggestions'
import type { CoverSuggestion } from '../services/types'

const item = (idSuggestion: number, idManga: number) => ({ idSuggestion, idManga }) as CoverSuggestion

describe('coverSuggestions helpers', () => {
  it('rounds the score to an integer percentage', () => {
    expect(scorePercent(0.913)).toBe('91%')
    expect(scorePercent(0.995)).toBe('100%')
  })

  it('groups by manga keeping the first-seen order', () => {
    const groups = groupByManga([item(1, 7), item(2, 3), item(3, 7)])
    expect(groups.map(([idManga, group]) => [idManga, group.map((s) => s.idSuggestion)])).toEqual([
      [7, [1, 3]],
      [3, [2]],
    ])
  })
})
