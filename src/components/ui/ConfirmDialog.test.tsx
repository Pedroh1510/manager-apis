import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Deletar torrent"
        message="Tem certeza?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Deletar torrent')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Deletar"
        message="Tem certeza?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText('Deletar')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirming', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        title="Deletar"
        message="Tem certeza?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancelling', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        title="Deletar"
        message="Tem certeza?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
