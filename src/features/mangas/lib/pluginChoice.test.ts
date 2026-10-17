import { describe, expect, it } from 'vitest'
import { ALL_PLUGINS, choiceLabel } from './pluginChoice'

describe('choiceLabel', () => {
  it('labels the all-plugins choice and a single plugin', () => {
    expect(choiceLabel(ALL_PLUGINS)).toBe('Todos os plugins')
    expect(choiceLabel({ id: 'nexustoons', name: 'Nexus Toons' })).toBe('Nexus Toons')
  })
})
