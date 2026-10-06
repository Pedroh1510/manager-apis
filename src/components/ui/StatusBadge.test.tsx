import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders "Online" when status is online', () => {
    render(<StatusBadge status="online" />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('renders "Offline" when status is offline', () => {
    render(<StatusBadge status="offline" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('renders "Verificando..." when status is loading', () => {
    render(<StatusBadge status="loading" />)
    expect(screen.getByText('Verificando...')).toBeInTheDocument()
  })

  it('applies green class for online status', () => {
    render(<StatusBadge status="online" />)
    expect(screen.getByText('Online')).toHaveClass('bg-success-bg')
  })

  it('applies red class for offline status', () => {
    render(<StatusBadge status="offline" />)
    expect(screen.getByText('Offline')).toHaveClass('bg-danger-bg')
  })
})

describe('StatusBadge for manga status', () => {
  it('maps each manga status to its semantic color', () => {
    const cases = [
      { status: 'active', label: 'Ativo', bg: 'bg-success-bg', text: 'text-success' },
      { status: 'partial', label: 'Parcial', bg: 'bg-warning-bg', text: 'text-warning' },
      { status: 'inactive', label: 'Inativo', bg: 'bg-danger-bg', text: 'text-danger' },
    ] as const
    for (const { status, label, bg, text } of cases) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toHaveClass(bg, text)
      unmount()
    }
  })
})
