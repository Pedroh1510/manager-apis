/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Sidebar } from '../Layout/Sidebar'
import { Button } from './Button'
import { Input } from './Input'
import { Toggle } from './Toggle'

const FOCUS_RING = ['focus-visible:ring-2', 'focus-visible:ring-accent']

describe('focus ring', () => {
  it('every interactive primitive shows the accent focus ring', () => {
    render(
      <MemoryRouter>
        <Button>botão</Button>
        <Input aria-label='campo' />
        <Toggle checked={false} onChange={() => {}} label='alternar' />
        <Sidebar />
      </MemoryRouter>
    )

    const elements = [
      screen.getByRole('button', { name: 'botão' }),
      screen.getByRole('textbox', { name: 'campo' }),
      screen.getByRole('switch', { name: 'alternar' }),
      screen.getByRole('link', { name: 'Status' }),
    ]
    for (const element of elements) {
      expect(element).toHaveClass(...FOCUS_RING)
    }
  })

  it('every select and tab outside the primitives uses the shared focus ring', () => {
    const src = resolve(__dirname, '../..')
    const files = (function walk(dir: string): string[] {
      return readdirSync(dir).flatMap((entry: string) => {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) return walk(path)
        return entry.endsWith('.tsx') && !entry.endsWith('.test.tsx') ? [path] : []
      })
    })(src)
    const users = files.filter((file) => /<select|role='tab'/.test(readFileSync(file, 'utf-8')))
    expect(users.length).toBeGreaterThan(0)
    for (const file of users) {
      expect(readFileSync(file, 'utf-8'), file).toMatch(/FOCUS_RING/)
    }
  })
})
