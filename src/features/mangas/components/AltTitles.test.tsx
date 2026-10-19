import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AltTitles } from './AltTitles'

// jsdom does no layout, so overflow is faked through the clamped element's sizes.
function fakeOverflow(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(clientHeight)
}

afterEach(() => vi.restoreAllMocks())

describe('AltTitles', () => {
  it('joins the titles with a middle dot', () => {
    render(<AltTitles titles={['Upando Sozinho', 'Na Honjaman Level Up']} />)

    expect(screen.getByText('Upando Sozinho · Na Honjaman Level Up')).toBeInTheDocument()
  })

  it('renders nothing without titles', () => {
    const { container } = render(<AltTitles titles={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('hides the expand button when the titles fit in two lines', () => {
    fakeOverflow(40, 40)
    render(<AltTitles titles={['A', 'B']} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('expands and collapses titles that overflow two lines', () => {
    fakeOverflow(120, 40)
    render(<AltTitles titles={['A', 'B', 'C']} />)
    const text = screen.getByText('A · B · C')
    expect(text).toHaveClass('line-clamp-2')

    fireEvent.click(screen.getByRole('button', { name: 'ver todos (3)' }))
    expect(text).not.toHaveClass('line-clamp-2')

    fireEvent.click(screen.getByRole('button', { name: 'ver menos' }))
    expect(text).toHaveClass('line-clamp-2')
  })
})
