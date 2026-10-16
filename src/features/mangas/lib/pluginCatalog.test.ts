import { describe, expect, it } from 'vitest'
import { dedupeByTitle, pluginLabel } from './pluginCatalog'

describe('pluginCatalog', () => {
  it('labels a plugin by name, falling back to its id', () => {
    expect(pluginLabel({ id: 'nexustoons', name: 'Nexus Toons' })).toBe('Nexus Toons')
    expect(pluginLabel({ id: 'nexustoons', name: '' })).toBe('nexustoons')
  })

  it('keeps the first catalog entry of each repeated title', () => {
    const list = [
      { id: 'a', title: 'X' },
      { id: 'b', title: 'X' },
      { id: 'c', title: 'Y' },
    ]
    expect(dedupeByTitle(list)).toEqual([list[0], list[2]])
  })
})
