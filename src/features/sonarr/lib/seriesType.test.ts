import { describe, expect, it } from 'vitest'
import { suggestSeriesType } from './seriesType'

describe('suggestSeriesType', () => {
  it('suggests anime only when the genres include Anime', () => {
    expect(suggestSeriesType(['Animation', 'Anime'])).toBe('anime')
    expect(suggestSeriesType(['Drama'])).toBe('standard')
    expect(suggestSeriesType([])).toBe('standard')
  })
})
