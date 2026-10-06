import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Table, Td, Th } from '../../../components/ui/Table';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useRss } from '../hooks/useRss';
import { AddRssItemDrawer } from '../components/AddRssItemDrawer';

export function RSSQueryPage() {
	const [scanAllItems, setScanAllItems] = useState(false);
	const [search, setSearch] = useState('');
	const [isAdding, setIsAdding] = useState(false);

	const { data, isLoading, isError, error, refetch } = useRss({
		scanAllItems: scanAllItems || undefined,
		q: search || undefined
	});

	return (
		<div className='mx-auto max-w-6xl'>
			<PageHeader
				title='Consulta RSS'
				subtitle={data ? `${data.length} item(s) encontrado(s)` : 'Feed do Anime RSS'}
				actions={
					<>
						<Button onClick={() => refetch()}>Atualizar</Button>
						<Button variant='primary' onClick={() => setIsAdding(true)}>
							Adicionar item
						</Button>
					</>
				}
			/>

			<div className='mb-3 flex flex-wrap items-center gap-3'>
				<Input
					aria-label='Buscar por título'
					placeholder='Buscar por título...'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className='max-w-sm'
				/>
				<label className='inline-flex items-center gap-2 text-xs text-text-muted'>
					<input
						type='checkbox'
						checked={scanAllItems}
						onChange={(e) => setScanAllItems(e.target.checked)}
						className={`h-3.5 w-3.5 rounded-sm border-border accent-accent ${FOCUS_RING}`}
					/>
					Consultar todos os itens (scanAllItems)
				</label>
			</div>

			{isLoading && <p className='text-xs text-text-muted'>Carregando feed…</p>}
			{isError && <p role='alert' className='rounded-md bg-danger-bg px-3 py-2 text-xs text-danger'>{getApiErrorMessage(error)}</p>}
			{data && data.length === 0 && (
				<p className='rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-text-muted'>
					Nenhum item no feed para essa busca.
				</p>
			)}
			{data && data.length > 0 && (
				<Table>
					<thead>
						<tr>
							<Th>Título</Th>
							<Th className='w-48'>Publicado</Th>
						</tr>
					</thead>
					<tbody>
						{data.map((item, idx) => (
							<tr key={`${item.title}-${idx}`} className='transition-colors hover:bg-surface-raised/60'>
								<Td>{item.title}</Td>
								<Td className='font-mono text-xs text-text-muted'>{item.pubDate ? String(item.pubDate).slice(0, 16).replace('T', ' ') : '—'}</Td>
							</tr>
						))}
					</tbody>
				</Table>
			)}

			<AddRssItemDrawer open={isAdding} onClose={() => setIsAdding(false)} />
		</div>
	);
}
