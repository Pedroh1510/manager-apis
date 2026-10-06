/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PAGES = ['anime-rss/pages/AdminPage.tsx', 'anime-rss/pages/RSSQueryPage.tsx', 'mangas/pages/AdminPage.tsx']
const RAW_PALETTE =
  /(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/
const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/

describe('design compliance', () => {
  it('existing pages use only design tokens and shared primitives', () => {
    for (const page of PAGES) {
      const source = readFileSync(join(__dirname, page), 'utf-8')
      expect(source, page).not.toMatch(RAW_PALETTE)
      expect(source, page).not.toMatch(LITERAL_COLOR)
      expect(source, page).toMatch(/from '..\/..\/..\/components\/ui\/Button'/)
      expect(source, page).toMatch(/from '..\/..\/..\/components\/ui\/(Card|Table)'/)
      // Raw form controls bypass the shared focus ring and density.
      expect(source, page).not.toMatch(/<input\s[^>]*type='text'/)
    }
  })
})
