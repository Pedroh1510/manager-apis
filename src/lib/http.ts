import axios from 'axios';

export const rssHttp = axios.create({
	baseURL: import.meta.env.VITE_RSS_API_URL,
	headers: { 'Content-Type': 'application/json' }
});

export const mangasHttp = axios.create({
	baseURL: import.meta.env.VITE_MANGAS_API_URL,
	headers: { 'Content-Type': 'application/json' }
});

/** The Express server in server/, same origin as the SPA (Vite proxies /api in dev). */
export const serverHttp = axios.create({
	baseURL: '/api',
	headers: { 'Content-Type': 'application/json' }
});
