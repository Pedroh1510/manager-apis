import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout/Layout'
import { GlobalStatusPage } from './features/status/pages/GlobalStatusPage'
import { RSSQueryPage } from './features/anime-rss/pages/RSSQueryPage'
import { AnimeRssAdminPage } from './features/anime-rss/pages/AdminPage'
import { MangasAdminPage } from './features/mangas/pages/AdminPage'
import { MangasListPage } from './features/mangas/pages/MangasPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to='/status' replace /> },
      { path: 'status', element: <GlobalStatusPage /> },
      { path: 'anime-rss/rss', element: <RSSQueryPage /> },
      { path: 'anime-rss/admin', element: <AnimeRssAdminPage /> },
      { path: 'mangas/admin', element: <MangasAdminPage /> },
      { path: 'mangas/list', element: <MangasListPage /> },
    ],
  },
])
