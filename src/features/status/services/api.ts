import { mangasHttp } from '../../../lib/http';

/** node-pg-migrate's run result: one entry per migration file. */
export interface Migration {
	name: string;
	path: string;
	timestamp: number;
}

/** Dry run: the migrations that `runMigrations` would apply. */
export async function fetchPendingMigrations(): Promise<Migration[]> {
	const { data } = await mangasHttp.get<Migration[]>('/migrations');
	return data;
}

export async function runMigrations(): Promise<Migration[]> {
	const { data } = await mangasHttp.post<Migration[]>('/migrations');
	return data;
}
