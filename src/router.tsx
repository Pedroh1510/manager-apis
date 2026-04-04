import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { AnimeRssStatusPage } from './features/anime-rss/pages/StatusPage';
import { RSSQueryPage } from './features/anime-rss/pages/RSSQueryPage';
import { AnimeRssAdminPage } from './features/anime-rss/pages/AdminPage';
import { MangasStatusPage } from './features/mangas/pages/StatusPage';
import { MangasAdminPage } from './features/mangas/pages/AdminPage';
import { MangasListPage } from './features/mangas/pages/MangasPage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{ index: true, element: <Navigate to='/anime-rss/status' replace /> },
			{ path: 'anime-rss/status', element: <AnimeRssStatusPage /> },
			{ path: 'anime-rss/rss', element: <RSSQueryPage /> },
			{ path: 'anime-rss/admin', element: <AnimeRssAdminPage /> },
			{ path: 'mangas/status', element: <MangasStatusPage /> },
			{ path: 'mangas/admin', element: <MangasAdminPage /> },
			{ path: 'mangas/list', element: <MangasListPage /> }
		]
	}
]);
