import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('renders children with default danger variant', () => {
    render(<Alert>Algo deu errado</Alert>)
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('renders warning and info variants', () => {
    const { rerender } = render(<Alert variant='warning'>Atenção</Alert>)
    expect(screen.getByText('Atenção')).toBeInTheDocument()

    rerender(<Alert variant='info'>Informação</Alert>)
    expect(screen.getByText('Informação')).toBeInTheDocument()
  })
})
