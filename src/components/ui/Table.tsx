import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/**
 * Dense data table primitives: hairline rows, muted uppercase headers.
 * @example <Table><thead><tr><Th>Título</Th></tr></thead><tbody><tr><Td>Naruto</Td></tr></tbody></Table>
 */
export function Table({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
	return (
		<div className='overflow-x-auto rounded-lg border border-border bg-surface shadow-raised'>
			<table className={`w-full border-collapse text-sm [&_tbody_tr:last-child_td]:border-b-0 ${className}`} {...props} />
		</div>
	);
}

export function Th({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={`h-8 border-b border-border bg-surface-raised px-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-subtle ${className}`}
			{...props}
		/>
	);
}

export function Td({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={`h-10 border-b border-border px-3 text-text ${className}`} {...props} />;
}
