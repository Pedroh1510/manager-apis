import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('forwards extra props like data-testid', () => {
    render(<Card data-testid='my-card'>conteúdo</Card>)
    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })
})
