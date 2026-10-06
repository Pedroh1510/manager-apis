import { fireEvent, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MangasListPage } from '../../features/mangas/pages/MangasPage'
import { MangasAdminPage } from '../../features/mangas/pages/AdminPage'
import { QueuesPage } from '../../features/queues/pages/QueuesPage'
import { MangaDetailPage } from '../../features/mangas/pages/MangaDetailPage'
import { RSSQueryPage } from '../../features/anime-rss/pages/RSSQueryPage'
import * as rssApi from '../../features/anime-rss/services/api'
import { useToast } from './useToast'
import * as mangasApi from '../../features/mangas/services/api'
import * as queuesApi from '../../features/queues/services/api'

vi.mock('../../features/mangas/services/api')
vi.mock('../../features/queues/services/api')
vi.mock('../../features/anime-rss/services/api')

const FOCUS_RING = ['focus-visible:ring-2', 'focus-visible:ring-accent']

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mangasApi.fetchPlugins).mockResolvedValue([{ id: 'tcb', name: 'TCB' }])
  vi.mocked(mangasApi.fetchMangaList).mockResolvedValue([
    { idManga: 1, title: 'Naruto', createdAt: '', updatedAt: '', connectors: [] },
  ])
  vi.mocked(queuesApi.fetchMangasQueuesSummary).mockResolvedValue([])
  vi.mocked(queuesApi.fetchRssQueuesSummary).mockResolvedValue([])
  vi.mocked(mangasApi.fetchChapters).mockResolvedValue([])
  vi.mocked(mangasApi.fetchMangasByPlugin).mockResolvedValue([{ id: 'n1', title: 'Naruto' }])
  vi.mocked(rssApi.fetchRss).mockResolvedValue([])
})

function ErrorToastTrigger() {
  const toast = useToast()
  return <button onClick={() => toast.error('falhou')}>disparar</button>
}

function expectRing(elements: HTMLElement[]) {
  expect(elements.length).toBeGreaterThan(0)
  for (const element of elements) expect(element).toHaveClass(...FOCUS_RING)
}

async function selectsOf(ui: ReactElement, ready: string) {
  renderWithProviders(ui)
  await screen.findByText(ready)
  return screen.getAllByRole('combobox')
}

describe('focus ring on screen controls', () => {
  it('every select and tab outside the primitives uses the shared focus ring', async () => {
    expectRing(await selectsOf(<MangasListPage />, 'Naruto'))
  })

  it('every select and tab outside the primitives uses the shared focus ring (admin)', async () => {
    expectRing(await selectsOf(<MangasAdminPage />, 'TCB'))
  })

  it('every select and tab outside the primitives uses the shared focus ring (add manga wizard)', async () => {
    renderWithProviders(<MangasListPage />)
    await screen.findByText('Naruto')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar mangá' }))
    const drawer = screen.getByRole('dialog', { name: 'Adicionar mangá' })
    await within(drawer).findByRole('option', { name: 'TCB' })
    expectRing(within(drawer).getAllByRole('combobox'))
  })

  it('every select and tab outside the primitives uses the shared focus ring (queues tabs)', () => {
    renderWithProviders(<QueuesPage />, { route: '/filas' })
    expectRing(screen.getAllByRole('tab'))
  })

  it('every link, close button, option and checkbox uses the shared focus ring', async () => {
    renderWithProviders(<MangasListPage />)
    expectRing([await screen.findByRole('link', { name: 'Naruto' })])

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar mangá' }))
    const drawer = screen.getByRole('dialog', { name: 'Adicionar mangá' })
    expectRing([within(drawer).getByRole('button', { name: 'Fechar painel' })])
    await within(drawer).findByRole('option', { name: 'TCB' })
    fireEvent.change(within(drawer).getAllByRole('combobox')[0], { target: { value: 'tcb' } })
    fireEvent.click(within(drawer).getByRole('button', { name: /próximo/i }))
    expectRing([await within(drawer).findByRole('button', { name: 'Naruto' })])
  })

  it('every link, close button, option and checkbox uses the shared focus ring (detail)', async () => {
    renderWithProviders(<MangaDetailPage />, { route: '/mangas/1', path: '/mangas/:idManga' })
    await screen.findByRole('heading', { name: 'Naruto' })
    expectRing([screen.getByRole('link', { name: '← Mangás' }), screen.getByRole('link', { name: 'Baixar zip' })])
  })

  it('every link, close button, option and checkbox uses the shared focus ring (not found)', async () => {
    renderWithProviders(<MangaDetailPage />, { route: '/mangas/999', path: '/mangas/:idManga' })
    expectRing([await screen.findByRole('link', { name: /voltar para a lista/i })])
  })

  it('every link, close button, option and checkbox uses the shared focus ring (queues and rss)', async () => {
    renderWithProviders(<QueuesPage />, { route: '/filas' })
    expectRing([screen.getByRole('link', { name: 'Abrir em nova aba' })])
  })

  it('every link, close button, option and checkbox uses the shared focus ring (rss checkbox)', async () => {
    renderWithProviders(<RSSQueryPage />)
    expectRing([screen.getByRole('checkbox')])
  })

  it('every link, close button, option and checkbox uses the shared focus ring (toast close)', () => {
    renderWithProviders(<ErrorToastTrigger />)
    fireEvent.click(screen.getByRole('button', { name: 'disparar' }))
    expectRing([screen.getByRole('button', { name: 'Fechar' })])
  })
})
