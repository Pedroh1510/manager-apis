// Test-only helper: fast refresh never loads it, so mixing exports is harmless.
/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from '../components/ui/Toast'

export function LocationDisplay() {
  const location = useLocation()
  return <div data-testid='location' hidden>{`${location.pathname}${location.search}`}</div>
}

interface Options {
  route?: string
  path?: string
  queryClient?: QueryClient
}

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

/**
 * Same provider tree as App (query client + toasts) plus a memory router, so
 * pages render the way they do in production.
 * @example renderWithProviders(<MangasListPage />, { route: '/mangas/list?q=one' })
 */
export function renderWithProviders(ui: ReactElement, { route = '/', path = '*', queryClient }: Options = {}) {
  const client = queryClient ?? createTestQueryClient()
  const tree = (children: ReactNode) => (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={children} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
  return { ...render(tree(ui)), queryClient: client }
}
