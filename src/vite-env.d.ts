/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_RSS_API_URL: string;
	readonly VITE_MANGAS_API_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
