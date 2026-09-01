import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it.each([
    ['success', 'Online'],
    ['danger', 'Offline'],
    ['warning', 'Verificando'],
    ['neutral', 'N/A'],
  ] as const)('renders %s variant with its text', (variant, text) => {
    render(<Badge variant={variant}>{text}</Badge>)
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})
