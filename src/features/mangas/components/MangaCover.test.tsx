import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MangaCover } from './MangaCover'

describe('MangaCover', () => {
  it.each([
    ['Black Clover', 'BC'],
    ['one piece', 'OP'],
    ['Naruto', 'N'],
    ['O Cavaleiro em Eterna Regressão', 'OC'],
    ['', '?'],
  ])('falls back to title initials when the image fails: %j -> %s', (title, initials) => {
    const { container } = render(<MangaCover src='https://x/cover' title={title} />)

    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(initials)).toBeInTheDocument()
  })

  it('renders the image with an accessible name until it fails', () => {
    render(<MangaCover src='https://x/cover' title='Black Clover' />)

    expect(screen.getByRole('img', { name: 'Capa de Black Clover' })).toHaveAttribute('src', 'https://x/cover')
  })
})
