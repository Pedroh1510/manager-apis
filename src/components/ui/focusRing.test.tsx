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
})
