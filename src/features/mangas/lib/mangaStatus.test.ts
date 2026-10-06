import { describe, expect, it } from 'vitest'
import { deriveMangaStatus } from './mangaStatus'

describe('deriveMangaStatus', () => {
  it('derives the manga status from its connectors', () => {
    expect(deriveMangaStatus([{ isActive: true }, { isActive: true }])).toEqual('active')
    expect(deriveMangaStatus([{ isActive: true }, { isActive: false }])).toEqual('partial')
    expect(deriveMangaStatus([{ isActive: false }])).toEqual('inactive')
    expect(deriveMangaStatus([])).toEqual('inactive')
  })
})
