import { describe, expect, it } from 'vitest'
import { deriveMangaStatus } from './mangaStatus'

describe('deriveMangaStatus', () => {
  it('derives the manga status from its connectors', () => {
    expect(deriveMangaStatus([{ isActive: true }, { isActive: true }])).toEqual('active')
    expect(deriveMangaStatus([{ isActive: true }, { isActive: false }])).toEqual('partial')
    expect(deriveMangaStatus([{ isActive: false }])).toEqual('inactive')
    expect(deriveMangaStatus([])).toEqual('inactive')
  })

  it('is inactive when the only active link is on a disabled connector', () => {
    expect(deriveMangaStatus([{ isActive: true, connectorEnabled: false }])).toEqual('inactive')
  })

  it('is partial with one fetching link and one active link of a disabled connector', () => {
    expect(
      deriveMangaStatus([
        { isActive: true, connectorEnabled: true },
        { isActive: true, connectorEnabled: false }
      ])
    ).toEqual('partial')
  })

  it('treats a missing connectorEnabled as enabled', () => {
    expect(deriveMangaStatus([{ isActive: true }])).toEqual('active')
  })
})
