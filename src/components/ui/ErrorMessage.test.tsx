import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the "Erro:" label with the given message', () => {
    render(<ErrorMessage message='Falha ao carregar dados' />)
    expect(screen.getByText('Erro:')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar dados')).toBeInTheDocument()
  })
})
