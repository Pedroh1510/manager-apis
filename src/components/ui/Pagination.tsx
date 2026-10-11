import { Button } from './Button';

interface PaginationProps {
	page: number;
	totalPages: number;
	onChange: (page: number) => void;
}

/**
 * "Página n de N" with Anterior/Próxima, disabled at the ends.
 * @example <Pagination page={2} totalPages={3} onChange={goTo} />
 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
	return (
		<nav aria-label='Paginação' className='flex items-center justify-end gap-3 text-sm text-text-muted'>
			<Button size='sm' disabled={page <= 1} onClick={() => onChange(page - 1)}>
				Anterior
			</Button>
			<span className='font-mono text-xs'>{`Página ${page} de ${totalPages}`}</span>
			<Button size='sm' disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
				Próxima
			</Button>
		</nav>
	);
}
