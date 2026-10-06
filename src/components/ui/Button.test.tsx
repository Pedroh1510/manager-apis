import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Salvar</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('respects the type attribute for form submission', () => {
    render(<Button type='submit'>Enviar</Button>)
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit')
  })

  it('only the primary variant uses the accent background', () => {
    const { unmount } = render(<Button variant='primary'>Primário</Button>)
    expect(screen.getByRole('button').className).toMatch(/(^|\s)bg-accent(\s|$)/)
    unmount()

    for (const variant of ['secondary', 'ghost', 'danger'] as const) {
      const view = render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button').className).not.toMatch(/(^|\s)bg-accent/)
      view.unmount()
    }
  })
})
