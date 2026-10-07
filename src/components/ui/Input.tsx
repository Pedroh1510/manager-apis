import type { ComponentProps } from 'react';
import { FOCUS_RING } from './focusRing';

// ComponentProps keeps `ref` (React 19 passes it as a prop) so forms can focus fields.
type InputProps = ComponentProps<'input'>;

export function Input({ className = '', ...props }: InputProps) {
	return (
		<input
			className={`h-8 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text placeholder:text-text-subtle transition-colors hover:border-text-subtle ${FOCUS_RING} disabled:opacity-50 ${className}`}
			{...props}
		/>
	);
}
