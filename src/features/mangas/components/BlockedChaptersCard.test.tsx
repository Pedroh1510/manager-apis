import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BlockedChaptersCard } from './BlockedChaptersCard'
import { formatDateTime } from '../../../lib/formatDate'
import type { BlockedChapter } from '../services/types'

const CREATED = '2026-11-20T10:00:00Z'
const ITEMS: BlockedChapter[] = [
  { idBlockedChapter: 9, idMangaConnector: 1, idPlugin: 'mangeek', idChapterPlugin: 'c', volume: '177.0000', reason: 'cópia do 171', createdAt: CREATED },
  { idBlockedChapter: 10, idMangaConnector: 1, idPlugin: 'tcb', idChapterPlugin: 'd', volume: 12.5, reason: null, createdAt: CREATED },
]

describe('BlockedChaptersCard', () => {
  it('lists entries with source, formatted volume, reason or dash and date', () => {
    render(<BlockedChaptersCard items={ITEMS} onUnblock={vi.fn()} />)
    expect(screen.getByText('mangeek')).toBeInTheDocument()
    expect(screen.getByText('177')).toBeInTheDocument()
    expect(screen.getByText('cópia do 171')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getAllByText(formatDateTime(CREATED))).toHaveLength(2)
  })

  it('unblock calls the handler with the blocked id', () => {
    const onUnblock = vi.fn()
    render(<BlockedChaptersCard items={ITEMS} onUnblock={onUnblock} />)
    fireEvent.click(screen.getAllByRole('button', { name: /^Desbloquear/ })[0])
    expect(onUnblock).toHaveBeenCalledWith(9)
  })

  it('shows the empty state', () => {
    render(<BlockedChaptersCard items={[]} onUnblock={vi.fn()} />)
    expect(screen.getByText('Nenhum capítulo bloqueado')).toBeInTheDocument()
  })
})
