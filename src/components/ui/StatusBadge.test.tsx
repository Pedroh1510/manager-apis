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
    expect(screen.getByText('Online')).toHaveClass('bg-green-100')
  })

  it('applies red class for offline status', () => {
    render(<StatusBadge status="offline" />)
    expect(screen.getByText('Offline')).toHaveClass('bg-red-100')
  })
})
