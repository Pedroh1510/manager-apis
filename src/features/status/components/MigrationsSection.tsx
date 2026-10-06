import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { fetchPendingMigrations, runMigrations, type Migration } from '../services/api';

const PENDING_KEY = ['mangas', 'migrations', 'pending'] as const;

function MigrationList({ migrations }: { migrations: Migration[] }) {
	return (
		<ul className='divide-y divide-border rounded-md border border-border bg-surface'>
			{migrations.map((migration) => (
				<li key={migration.name} className='px-3 py-1.5 font-mono text-xs text-text'>
					{migration.name}
				</li>
			))}
		</ul>
	);
}

/**
 * Pending manager-mangas migrations and a confirmed "run" button.
 * @example <MigrationsSection />
 */
export function MigrationsSection() {
	const queryClient = useQueryClient();
	const toast = useToast();
	const [confirming, setConfirming] = useState(false);
	const pending = useQuery({ queryKey: PENDING_KEY, queryFn: fetchPendingMigrations, retry: false });
	const refresh = () => queryClient.invalidateQueries({ queryKey: PENDING_KEY });

	const run = useMutation({
		mutationFn: runMigrations,
		onSuccess: (applied) => toast.success(`${applied.length} migrations aplicadas`),
		onError: (error) => toast.error(getApiErrorMessage(error)),
		onSettled: refresh
	});

	const migrations = pending.data ?? [];
	return (
		<div>
			<div className='mb-2 flex items-center justify-between'>
				<h3 className='text-[11px] font-medium uppercase tracking-wider text-text-subtle'>Migrations</h3>
				<Button size='sm' variant='primary' disabled={migrations.length === 0 || run.isPending} onClick={() => setConfirming(true)}>
					{run.isPending ? 'Executando…' : 'Executar migrations'}
				</Button>
			</div>
			{pending.isLoading && <p className='text-xs text-text-muted'>Verificando migrations…</p>}
			{pending.isError && (
				<p className='rounded-md bg-danger-bg px-3 py-2 text-xs text-danger'>
					Não foi possível listar as migrations: {getApiErrorMessage(pending.error)}
				</p>
			)}
			{pending.isSuccess && migrations.length === 0 && <p className='text-xs text-success'>Nenhuma migration pendente</p>}
			{migrations.length > 0 && <MigrationList migrations={migrations} />}

			<ConfirmDialog
				open={confirming}
				title='Executar migrations'
				message={`${migrations.length} migrations serão aplicadas no banco do Mangas Manager.`}
				onConfirm={() => {
					setConfirming(false);
					run.mutate();
				}}
				onCancel={() => setConfirming(false)}
			>
				<MigrationList migrations={migrations} />
			</ConfirmDialog>
		</div>
	);
}
