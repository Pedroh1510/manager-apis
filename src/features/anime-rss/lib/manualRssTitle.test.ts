import { describe, expect, it } from 'vitest'
import { exceedsTitleLimit, formatManualRssTitle, parseEpisodeNumber } from './manualRssTitle'

describe('formatManualRssTitle', () => {
  it('formats an episode with codec', () => {
    const title = formatManualRssTitle({ kind: 'episode', title: 'Sousou no Frieren', season: 1, episode: 28, format: '1080p', codec: 'x265' })
    expect(title).toBe('[MANUAL] Sousou no Frieren S01E28 [1080p] [x265] [portugues]')
  })

  it('omits the codec block when there is no codec', () => {
    const title = formatManualRssTitle({ kind: 'episode', title: 'Frieren', season: 2, episode: 5, format: '720p', codec: null })
    expect(title).toBe('[MANUAL] Frieren S02E05 [720p] [portugues]')
  })

  it('pads to two digits without truncating larger numbers', () => {
    const title = formatManualRssTitle({ kind: 'episode', title: 'One Piece', season: 0, episode: 1100, format: '1080p', codec: null })
    expect(title).toBe('[MANUAL] One Piece S00E1100 [1080p] [portugues]')
  })

  it('formats title-only items with prefix and language tag', () => {
    expect(formatManualRssTitle({ kind: 'titleOnly', title: 'Frieren Movie' })).toBe('[MANUAL] Frieren Movie [portugues]')
  })

  it('trims the user title', () => {
    expect(formatManualRssTitle({ kind: 'titleOnly', title: '  Frieren  ' })).toBe('[MANUAL] Frieren [portugues]')
  })
})

describe('parseEpisodeNumber', () => {
  it('accepts whole numbers at or above the minimum', () => {
    expect(parseEpisodeNumber('0', 0)).toBe(0)
    expect(parseEpisodeNumber('05', 1)).toBe(5)
    expect(parseEpisodeNumber(' 12 ', 1)).toBe(12)
  })

  it('rejects empty, fractional, negative and below-minimum values', () => {
    expect(parseEpisodeNumber('', 0)).toBeNull()
    expect(parseEpisodeNumber('1.5', 0)).toBeNull()
    expect(parseEpisodeNumber('-1', 0)).toBeNull()
    expect(parseEpisodeNumber('0', 1)).toBeNull()
    expect(parseEpisodeNumber('1e2', 1)).toBeNull()
  })
})

describe('exceedsTitleLimit', () => {
  it('flags only titles longer than 500 characters', () => {
    expect(exceedsTitleLimit(null)).toBe(false)
    expect(exceedsTitleLimit('a'.repeat(500))).toBe(false)
    expect(exceedsTitleLimit('a'.repeat(501))).toBe(true)
  })
})
