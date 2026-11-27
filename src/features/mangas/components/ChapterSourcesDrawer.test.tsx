import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChapterSourcesDrawer } from './ChapterSourcesDrawer'
import type { ChapterSource } from '../services/types'

const base = { idPlugin: 'p', titlePlugin: 'T', isCurrent: false }
const SOURCES: ChapterSource[] = [
  { ...base, idMangaConnector: 1, idPlugin: 'tcb', titlePlugin: 'Naruto TCB', isCurrent: true, status: 'available', idChapterPlugin: 'a1' },
  { ...base, idMangaConnector: 2, idPlugin: 'mangeek', titlePlugin: 'Naruto MG', status: 'available', idChapterPlugin: 'b2' },
  { ...base, idMangaConnector: 3, idPlugin: 'x', titlePlugin: 'X', status: 'missing' },
  { ...base, idMangaConnector: 4, idPlugin: 'y', titlePlugin: 'Y', status: 'blocked', idChapterPlugin: 'y1' },
  { ...base, idMangaConnector: 5, idPlugin: 'z', titlePlugin: 'Z', status: 'disabled', reason: 'paywall' },
  { ...base, idMangaConnector: 6, idPlugin: 'w', titlePlugin: 'W', status: 'failed', reason: 'timeout' },
]

function setup(props: Partial<Parameters<typeof ChapterSourcesDrawer>[0]> = {}) {
  const onChoose = vi.fn()
  const onClose = vi.fn()
  render(<ChapterSourcesDrawer open title='Trocar fonte' sources={SOURCES} isLoading={false} isError={false} onChoose={onChoose} onClose={onClose} {...props} />)
  return { onChoose, onClose }
}

describe('ChapterSourcesDrawer', () => {
  it('shows loading while sources are fetched', () => {
    setup({ sources: undefined, isLoading: true })
    expect(screen.getByText('Carregando fontes…')).toBeInTheDocument()
  })

  it('enables only available sources and shows reasons for the rest', () => {
    setup()
    expect(screen.getAllByRole('button', { name: /^Usar esta/ })).toHaveLength(2)
    expect(screen.getByText('não tem este capítulo')).toBeInTheDocument()
    expect(screen.getByText('bloqueado')).toBeInTheDocument()
    expect(screen.getByText('conector desligado: paywall')).toBeInTheDocument()
    expect(screen.getByText('fonte falhou: timeout')).toBeInTheDocument()
  })

  it('marks the current source', () => {
    setup()
    const row = screen.getByText('Naruto TCB').closest('li') as HTMLElement
    expect(within(row).getByText('atual')).toBeInTheDocument()
  })

  it('choosing a source passes its idMangaConnector and idChapterPlugin', () => {
    const { onChoose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Usar esta: Naruto MG' }))
    expect(onChoose).toHaveBeenCalledWith({ idMangaConnector: 2, idChapterPlugin: 'b2' })
  })

  it('shows an error message when sources fail to load', () => {
    setup({ sources: undefined, isError: true })
    expect(screen.getByText('Não foi possível carregar as fontes')).toBeInTheDocument()
  })
})
