import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { useAdminActions } from '../hooks/useAdminActions';
import { usePlugins } from '../hooks/usePlugins';

const labelCls = 'mb-1 block text-xs font-medium text-text-muted';
const selectCls = `h-8 w-full rounded-md border border-border bg-surface px-2 text-sm text-text ${FOCUS_RING}`;

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
	return (
		<div>
			<label htmlFor={id} className={labelCls}>
				{label}
			</label>
			{children}
		</div>
	);
}

function SettingsCard({ title, description, children, onSubmit }: { title: string; description: string; children: ReactNode; onSubmit: (e: FormEvent) => void }) {
	return (
		<Card>
			<form onSubmit={onSubmit} className='space-y-3'>
				<div>
					<h2 className='text-sm font-semibold text-text'>{title}</h2>
					<p className='text-xs text-text-muted'>{description}</p>
				</div>
				{children}
			</form>
		</Card>
	);
}

export function MangasAdminPage() {
	const { data: plugins, isLoading } = usePlugins();
	const { updateCookie, updateCredentials, searchChapters, refreshCatalog, syncCovers, cleanKavita } = useAdminActions();
	const [selectedPlugin, setSelectedPlugin] = useState('');
	const [pluginFilter, setPluginFilter] = useState('');
	const [cookie, setCookie] = useState('');
	const [userAgent, setUserAgent] = useState('');
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');

	const filteredPlugins = (plugins ?? [])
		.filter((p): p is NonNullable<typeof p> => p != null)
		.filter((p) => !pluginFilter || (p.name ?? p.id ?? '').toLowerCase().includes(pluginFilter.toLowerCase()));
	const selectedPluginName = plugins?.find((p) => p?.id === selectedPlugin)?.name ?? selectedPlugin;

	function handleCookieSubmit(e: FormEvent) {
		e.preventDefault();
		if (!selectedPlugin) return;
		updateCookie.mutate({ idPlugin: selectedPlugin, cookie, ...(userAgent ? { userAgent } : {}) });
	}

	function handleCredentialsSubmit(e: FormEvent) {
		e.preventDefault();
		if (!selectedPlugin) return;
		updateCredentials.mutate({ idPlugin: selectedPlugin, login, password });
	}

	if (isLoading) return <p className='text-xs text-text-muted'>Carregando plugins…</p>;

	return (
		<div className='mx-auto max-w-4xl'>
			<PageHeader title='Configurações' subtitle='Mangas Manager — acesso aos plugins e atualização do catálogo' />

			<Card className='mb-4'>
				<div className='grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
					<Field id='plugin-select' label='Plugin'>
						<Input placeholder='Filtrar plugin...' value={pluginFilter} onChange={(e) => setPluginFilter(e.target.value)} className='mb-1.5' />
						<select id='plugin-select' value={selectedPlugin} onChange={(e) => setSelectedPlugin(e.target.value)} className={selectCls}>
							<option value=''>Selecione um plugin</option>
							{filteredPlugins.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name ?? p.id}
								</option>
							))}
						</select>
					</Field>
					<div className='flex gap-2'>
						<Button
							variant='primary'
							onClick={() => selectedPlugin && refreshCatalog.mutate(selectedPlugin)}
							disabled={!selectedPlugin || refreshCatalog.isPending}
						>
							Atualizar catálogo
						</Button>
						<Button onClick={() => searchChapters.mutate()} disabled={searchChapters.isPending}>
							Buscar capítulos
						</Button>
						<Button onClick={() => syncCovers.mutate(selectedPlugin || undefined)} disabled={syncCovers.isPending}>
							Sincronizar capas ({selectedPlugin ? selectedPluginName : 'todos'})
						</Button>
					</div>
				</div>
			</Card>

			<div className='grid gap-4 md:grid-cols-2'>
				<SettingsCard title='Cookie' description='Usado em toda requisição ao plugin selecionado.' onSubmit={handleCookieSubmit}>
					<Field id='cookie-input' label='Cookie'>
						<Input id='cookie-input' value={cookie} onChange={(e) => setCookie(e.target.value)} placeholder='session=abc123; token=xyz' className='font-mono' />
					</Field>
					<Field id='user-agent-input' label='User-Agent'>
						<Input id='user-agent-input' value={userAgent} onChange={(e) => setUserAgent(e.target.value)} placeholder='Mozilla/5.0 ...' className='font-mono' />
					</Field>
					<Button type='submit' variant='primary' disabled={!selectedPlugin || !cookie || updateCookie.isPending}>
						{updateCookie.isPending ? 'Salvando...' : 'Salvar cookie'}
					</Button>
				</SettingsCard>

				<SettingsCard title='Credenciais' description='Login do plugin, quando ele exige conta.' onSubmit={handleCredentialsSubmit}>
					<Field id='login-input' label='Login'>
						<Input id='login-input' value={login} onChange={(e) => setLogin(e.target.value)} />
					</Field>
					<Field id='password-input' label='Senha'>
						<Input id='password-input' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
					</Field>
					<Button type='submit' variant='primary' disabled={!selectedPlugin || !login || !password || updateCredentials.isPending}>
						{updateCredentials.isPending ? 'Salvando...' : 'Salvar credenciais'}
					</Button>
				</SettingsCard>
			</div>

			<Card className='mt-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-sm font-semibold text-text'>Manutenção</h2>
						<p className='text-xs text-text-muted'>Apaga do disco os capítulos 100% lidos no Kavita, mantendo o último de cada mangá. Também roda a cada 6h.</p>
					</div>
					<Button onClick={() => cleanKavita.mutate()} disabled={cleanKavita.isPending}>
						{cleanKavita.isPending ? 'Limpando...' : 'Limpar Kavita'}
					</Button>
				</div>
			</Card>
		</div>
	);
}
