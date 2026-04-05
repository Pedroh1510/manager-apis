import { useState, type FormEvent } from 'react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { usePlugins } from '../hooks/usePlugins';
import { useAdminActions } from '../hooks/useAdminActions';

export function MangasAdminPage() {
	const { data: plugins, isLoading } = usePlugins();
	const { updateCookie, updateCredentials, updateMangasByPlugin } =
		useAdminActions();

	const [selectedPlugin, setSelectedPlugin] = useState('');
	const [pluginFilter, setPluginFilter] = useState('');
	const [cookie, setCookie] = useState('');
	const [userAgent, setUserAgent] = useState('');
	const [credentialsJson, setCredentialsJson] = useState('{}');

	function handleCookieSubmit(e: FormEvent) {
		e.preventDefault();
		if (!selectedPlugin) return;
		updateCookie.mutate({
			idPlugin: selectedPlugin,
			cookie,
			...(userAgent ? { userAgent } : {})
		});
	}

	function handleCredentialsSubmit(e: FormEvent) {
		e.preventDefault();
		if (!selectedPlugin) return;
		let credentials: Record<string, unknown> = {};
		try {
			credentials = JSON.parse(credentialsJson);
		} catch {
			return;
		}
		updateCredentials.mutate({
			idPlugin: selectedPlugin,
			credentials
		});
	}

	const filteredPlugins = (plugins ?? [])
		.filter((p): p is NonNullable<typeof p> => p != null)
		.filter((p) =>
			!pluginFilter ||
			(p.name ?? p.id ?? '').toLowerCase().includes(pluginFilter.toLowerCase())
		);

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className='space-y-8'>
			<h1 className='text-2xl font-bold text-gray-900'>
				Mangas Manager — Configurações / ADM
			</h1>

			<div>
				<label
					htmlFor='plugin-select'
					className='mb-1 block text-sm font-medium text-gray-700'
				>
					Plugin
				</label>
				<input
					type='text'
					placeholder='Filtrar plugin...'
					value={pluginFilter}
					onChange={(e) => setPluginFilter(e.target.value)}
					className='mb-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				<select
					id='plugin-select'
					value={selectedPlugin}
					onChange={(e) => setSelectedPlugin(e.target.value)}
					className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				>
					<option value=''>Selecione um plugin</option>
					{filteredPlugins.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name ?? p.id}
						</option>
					))}
				</select>
			</div>

			<div>
				<button
					onClick={() =>
						selectedPlugin && updateMangasByPlugin.mutate(selectedPlugin)
					}
					disabled={!selectedPlugin || updateMangasByPlugin.isPending}
					className='rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50'
				>
					{updateMangasByPlugin.isPending
						? 'Atualizando...'
						: 'Atualizar Mangas'}
				</button>
				{updateMangasByPlugin.isSuccess && (
					<p className='mt-2 text-sm text-green-600'>
						Mangas atualizados com sucesso!
					</p>
				)}
			</div>

			<form
				onSubmit={handleCookieSubmit}
				className='rounded-lg border bg-white p-6 shadow-sm'
			>
				<h2 className='mb-4 text-lg font-semibold text-gray-800'>
					Atualizar Cookie
				</h2>
				<div className='mb-4'>
					<label
						htmlFor='cookie-input'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						Cookie
					</label>
					<input
						id='cookie-input'
						type='text'
						value={cookie}
						onChange={(e) => setCookie(e.target.value)}
						placeholder='session=abc123; token=xyz'
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
				<div className='mb-4'>
					<label
						htmlFor='user-agent-input'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						User-Agent
					</label>
					<input
						id='user-agent-input'
						type='text'
						value={userAgent}
						onChange={(e) => setUserAgent(e.target.value)}
						placeholder='Mozilla/5.0 ...'
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
				<button
					type='submit'
					disabled={!selectedPlugin || !cookie || updateCookie.isPending}
					className='rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50'
				>
					{updateCookie.isPending ? 'Salvando...' : 'Salvar Cookie'}
				</button>
				{updateCookie.isSuccess && (
					<p className='mt-2 text-sm text-green-600'>Cookie atualizado!</p>
				)}
			</form>

			<form
				onSubmit={handleCredentialsSubmit}
				className='rounded-lg border bg-white p-6 shadow-sm'
			>
				<h2 className='mb-4 text-lg font-semibold text-gray-800'>
					Atualizar Credenciais
				</h2>
				<div className='mb-4'>
					<label
						htmlFor='credentials-input'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						Credenciais (JSON)
					</label>
					<textarea
						id='credentials-input'
						value={credentialsJson}
						onChange={(e) => setCredentialsJson(e.target.value)}
						rows={4}
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
				<button
					type='submit'
					disabled={!selectedPlugin || updateCredentials.isPending}
					className='rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50'
				>
					{updateCredentials.isPending ? 'Salvando...' : 'Salvar Credenciais'}
				</button>
				{updateCredentials.isSuccess && (
					<p className='mt-2 text-sm text-green-600'>
						Credenciais atualizadas!
					</p>
				)}
			</form>
		</div>
	);
}
