import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Drawer } from './Drawer'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Drawer open={open} title='Novo item' onClose={() => setOpen(false)}>
        <label>
          Título
          <input />
        </label>
        <button>Salvar</button>
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  it('focuses the first field when opened', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(screen.getByRole('dialog', { name: 'Novo item' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveFocus()
  })

  it('closes on Escape and overlay click and restores focus', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })

    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()

    fireEvent.click(opener)
    fireEvent.click(screen.getByTestId('drawer-overlay'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
