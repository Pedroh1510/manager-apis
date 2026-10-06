import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './Toast'
import { useToast } from './useToast'

function Trigger({ kind, text }: { kind: 'success' | 'error'; text: string }) {
  const toast = useToast()
  return <button onClick={() => toast[kind](text)}>disparar</button>
}

function renderTrigger(kind: 'success' | 'error', text: string) {
  render(
    <ToastProvider>
      <Trigger kind={kind} text={text} />
    </ToastProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'disparar' }))
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('success toast disappears after 4000ms', () => {
    renderTrigger('success', 'ok')
    expect(screen.getByRole('status')).toHaveTextContent('ok')

    act(() => vi.advanceTimersByTime(3999))
    expect(screen.getByText('ok')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByText('ok')).not.toBeInTheDocument()
  })

  it('error toast stays until closed', () => {
    renderTrigger('error', 'falhou')
    expect(screen.getByRole('alert')).toHaveTextContent('falhou')

    act(() => vi.advanceTimersByTime(60000))
    expect(screen.getByText('falhou')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByText('falhou')).not.toBeInTheDocument()
  })
})
