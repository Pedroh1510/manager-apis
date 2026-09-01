import { useState, type FormEvent } from 'react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { usePlugins } from '../hooks/usePlugins';
import { useAdminActions } from '../hooks/useAdminActions';

const inputCls =
	'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const labelCls = 'mb-1 block text-sm font-medium text-text-muted';

export function MangasAdminPage() {
	const { data: plugins, isLoading } = usePlugins();
	const { updateCookie, updateCredentials, updateMangasByPlugin } =
		useAdminActions();

	const [selectedPlugin, setSelectedPlugin] = useState('');
	const [pluginFilter, setPluginFilter] = useState('');
	const [cookie, setCookie] = useState('');
	const [userAgent, setUserAgent] = useState('');
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');

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
		updateCredentials.mutate({
			idPlugin: selectedPlugin,
			login,
			password
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
			<h1 className='text-3xl font-semibold tracking-tight text-text'>
				Mangas Manager — Configurações / ADM
			</h1>

			<div>
				<label htmlFor='plugin-select' className={labelCls}>
					Plugin
				</label>
				<input
					type='text'
					placeholder='Filtrar plugin...'
					value={pluginFilter}
					onChange={(e) => setPluginFilter(e.target.value)}
					className={`mb-1 block ${inputCls}`}
				/>
				<select
					id='plugin-select'
					value={selectedPlugin}
					onChange={(e) => setSelectedPlugin(e.target.value)}
					className={inputCls}
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
				<Button
					variant='primary'
					onClick={() =>
						selectedPlugin && updateMangasByPlugin.mutate(selectedPlugin)
					}
					disabled={!selectedPlugin || updateMangasByPlugin.isPending}
				>
					{updateMangasByPlugin.isPending
						? 'Atualizando...'
						: 'Atualizar Mangas'}
				</Button>
				{updateMangasByPlugin.isSuccess && (
					<p className='mt-2 text-sm text-success'>
						Mangas atualizados com sucesso!
					</p>
				)}
			</div>

			<form
				onSubmit={handleCookieSubmit}
				className='rounded-lg border border-border bg-surface p-6'
			>
				<h2 className='mb-4 text-lg font-semibold text-text'>
					Atualizar Cookie
				</h2>
				<div className='mb-4'>
					<label htmlFor='cookie-input' className={labelCls}>
						Cookie
					</label>
					<input
						id='cookie-input'
						type='text'
						value={cookie}
						onChange={(e) => setCookie(e.target.value)}
						placeholder='session=abc123; token=xyz'
						className={inputCls}
					/>
				</div>
				<div className='mb-4'>
					<label htmlFor='user-agent-input' className={labelCls}>
						User-Agent
					</label>
					<input
						id='user-agent-input'
						type='text'
						value={userAgent}
						onChange={(e) => setUserAgent(e.target.value)}
						placeholder='Mozilla/5.0 ...'
						className={inputCls}
					/>
				</div>
				<Button
					type='submit'
					variant='primary'
					disabled={!selectedPlugin || !cookie || updateCookie.isPending}
				>
					{updateCookie.isPending ? 'Salvando...' : 'Salvar Cookie'}
				</Button>
				{updateCookie.isSuccess && (
					<p className='mt-2 text-sm text-success'>Cookie atualizado!</p>
				)}
			</form>

			<form
				onSubmit={handleCredentialsSubmit}
				className='rounded-lg border border-border bg-surface p-6'
			>
				<h2 className='mb-4 text-lg font-semibold text-text'>
					Atualizar Credenciais
				</h2>
				<div className='mb-4'>
					<label htmlFor='login-input' className={labelCls}>
						Login
					</label>
					<input
						id='login-input'
						type='text'
						value={login}
						onChange={(e) => setLogin(e.target.value)}
						className={inputCls}
					/>
				</div>
				<div className='mb-4'>
					<label htmlFor='password-input' className={labelCls}>
						Senha
					</label>
					<input
						id='password-input'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={inputCls}
					/>
				</div>
				<Button
					type='submit'
					variant='primary'
					disabled={
						!selectedPlugin || !login || !password || updateCredentials.isPending
					}
				>
					{updateCredentials.isPending ? 'Salvando...' : 'Salvar Credenciais'}
				</Button>
				{updateCredentials.isSuccess && (
					<p className='mt-2 text-sm text-success'>
						Credenciais atualizadas!
					</p>
				)}
			</form>
		</div>
	);
}
