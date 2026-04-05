import { useState } from 'react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useRss } from '../hooks/useRss';

export function RSSQueryPage() {
	const [scanAllItems, setScanAllItems] = useState(false);
	const [search, setSearch] = useState('');

	const { data, isLoading, isError, error } = useRss({
		scanAllItems: scanAllItems || undefined,
		q: search || undefined
	});

	return (
		<div>
			<h1 className='mb-6 text-2xl font-bold text-gray-900'>
				Anime RSS — Consulta
			</h1>

			<div className='mb-4 flex flex-wrap items-center gap-4'>
				<label className='flex items-center gap-2 text-sm'>
					<input
						type='checkbox'
						checked={scanAllItems}
						onChange={(e) => setScanAllItems(e.target.checked)}
						className='rounded'
					/>
					Consultar todos os itens (scanAllItems)
				</label>

				<input
					type='text'
					placeholder='Buscar por título...'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			</div>

			{isLoading && <LoadingSpinner />}
			{isError && <ErrorMessage message={(error as Error).message} />}

			{data && (
				<>
					<p className='mb-3 text-sm text-gray-500'>
						{data.length} item(s) encontrado(s)
					</p>
					<ul className='space-y-2'>
						{data.map((item, idx) => (
							<li
								key={idx}
								className='rounded-md border bg-white p-3 text-sm text-gray-800'
							>
								{item.title}
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
