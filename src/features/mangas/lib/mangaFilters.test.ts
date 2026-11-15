import { describe, expect, it } from 'vitest'
import { filterMangas } from './mangaFilters'
import { connector, manga } from '../test/fixtures'

describe('filterMangas', () => {
  it('lists a manga whose only link is on a disabled connector as inactive', () => {
    const wicomixOnly = manga(1, 'Necromante', [{ ...connector('wicomix', true), connectorEnabled: false }])
    const fetching = manga(2, 'Naruto', [connector('tcb', true)])

    const inactive = filterMangas([wicomixOnly, fetching], { q: '', plugin: '', status: 'inactive' })

    expect(inactive.map((item) => item.title)).toEqual(['Necromante'])
  })
})
