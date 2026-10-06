import { fireEvent, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MangasListPage } from '../../features/mangas/pages/MangasPage'
import { MangasAdminPage } from '../../features/mangas/pages/AdminPage'
import { QueuesPage } from '../../features/queues/pages/QueuesPage'
import * as mangasApi from '../../features/mangas/services/api'
import * as queuesApi from '../../features/queues/services/api'

vi.mock('../../features/mangas/services/api')
vi.mock('../../features/queues/services/api')

const FOCUS_RING = ['focus-visible:ring-2', 'focus-visible:ring-accent']

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mangasApi.fetchPlugins).mockResolvedValue([{ id: 'tcb', name: 'TCB' }])
  vi.mocked(mangasApi.fetchMangaList).mockResolvedValue([
    { idManga: 1, title: 'Naruto', createdAt: '', updatedAt: '', connectors: [] },
  ])
  vi.mocked(queuesApi.fetchMangasQueuesSummary).mockResolvedValue([])
  vi.mocked(queuesApi.fetchRssQueuesSummary).mockResolvedValue([])
})

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
})
