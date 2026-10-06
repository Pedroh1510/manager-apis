import { useSearchParams } from 'react-router-dom';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { QueuesSummaryBlock } from '../components/QueuesSummaryBlock';
import type { QueuesApi } from '../services/types';

const TABS: ReadonlyArray<{ api: QueuesApi; label: string; baseUrl: string }> = [
	{ api: 'mangas', label: 'Mangas', baseUrl: import.meta.env.VITE_MANGAS_API_URL },
	{ api: 'anime-rss', label: 'Anime RSS', baseUrl: import.meta.env.VITE_RSS_API_URL }
];

/**
 * Native queue counts on top, each API's own bull-board below for retries,
 * payloads and cleanup. The selected API lives in `?api=`.
 * @example <Route path='filas' element={<QueuesPage />} />
 */
export function QueuesPage() {
	const [params, setParams] = useSearchParams();
	const current = TABS.find((tab) => tab.api === params.get('api')) ?? TABS[0];
	const boardUrl = `${current.baseUrl}/queues`;

	return (
		<div className='mx-auto flex h-full max-w-7xl flex-col gap-4'>
			<header className='flex items-end justify-between'>
				<div>
					<h1 className='text-xl font-semibold tracking-tight text-text'>Filas</h1>
					<p className='mt-0.5 text-xs text-text-muted'>Contagem por estado e bull-board de cada API</p>
				</div>
				<div role='tablist' aria-label='API' className='inline-flex rounded-md border border-border bg-surface p-0.5'>
					{TABS.map((tab) => (
						<button
							key={tab.api}
							role='tab'
							aria-selected={tab.api === current.api}
							onClick={() => setParams({ api: tab.api }, { replace: true })}
							className={`h-7 rounded-sm px-3 text-xs font-medium transition-colors ${FOCUS_RING} ${
								tab.api === current.api ? 'bg-surface-raised text-text shadow-raised' : 'text-text-muted hover:text-text'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</header>

			<QueuesSummaryBlock key={current.api} api={current.api} />

			<section className='flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-raised'>
				<div className='flex h-9 items-center justify-between border-b border-border px-3'>
					<span className='font-mono text-xs text-text-muted'>{boardUrl}</span>
					<a href={boardUrl} target='_blank' rel='noopener noreferrer' className={`rounded-sm text-xs text-accent hover:underline ${FOCUS_RING}`}>
						Abrir em nova aba
					</a>
				</div>
				<iframe title={`Bull Board — ${current.label}`} src={boardUrl} className='w-full flex-1 bg-white' />
			</section>
		</div>
	);
}
