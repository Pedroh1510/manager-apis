import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useManualTitleFields } from './useManualTitleFields'

describe('useManualTitleFields', () => {
  it('starts empty with 1080p and no codec', () => {
    const { result } = renderHook(() => useManualTitleFields())
    expect(result.current.values).toMatchObject({ title: '', isTitleOnly: false, format: '1080p', codec: null })
    expect(result.current.composedTitle).toBeNull()
  })

  it('composes only once title, season and episode are valid', () => {
    const { result } = renderHook(() => useManualTitleFields())

    act(() => result.current.update({ title: 'Frieren', season: '1' }))
    expect(result.current.composedTitle).toBeNull()
    act(() => result.current.update({ episode: '0' }))
    expect(result.current.composedTitle).toBeNull()

    act(() => result.current.update({ episode: '3', codec: 'AV1' }))
    expect(result.current.composedTitle).toBe('[MANUAL] Frieren S01E03 [1080p] [AV1] [portugues]')
  })

  it('ignores episode fields in title-only mode', () => {
    const { result } = renderHook(() => useManualTitleFields())
    act(() => result.current.update({ title: 'Frieren', isTitleOnly: true }))
    expect(result.current.composedTitle).toBe('[MANUAL] Frieren [portugues]')
  })

  it('advances to the next episode', () => {
    const { result } = renderHook(() => useManualTitleFields())
    act(() => result.current.update({ episode: '05' }))
    act(() => result.current.advanceEpisode())
    expect(result.current.values.episode).toBe('6')
  })
})
