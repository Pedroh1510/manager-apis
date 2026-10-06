import { Table, Td } from './Table';

const DEFAULT_ROWS = 6;

/**
 * Busy table with pulsing rows, shown while a list loads.
 * @example {isLoading && <TablePlaceholder />}
 */
export function TablePlaceholder({ rows = DEFAULT_ROWS }: { rows?: number }) {
	return (
		<Table aria-busy='true'>
			<tbody>
				{Array.from({ length: rows }, (_, index) => (
					<tr key={index} data-testid='placeholder-row'>
						<Td>
							<span className='block h-3 w-full animate-pulse rounded-sm bg-surface-raised' />
						</Td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}
