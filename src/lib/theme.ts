export const THEME_STORAGE_KEY = 'manager-apis-theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme | null {
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : null;
}

export function getPreferredTheme(): Theme {
	const stored = getStoredTheme();
	if (stored) return stored;
	const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
	return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	applyTheme(theme);
}
