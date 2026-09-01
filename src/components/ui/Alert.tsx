import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'warning' | 'info';

const variantClasses: Record<AlertVariant, string> = {
	danger: 'bg-danger-bg text-danger',
	warning: 'bg-warning-bg text-warning',
	info: 'bg-accent-muted text-accent'
};

interface AlertProps {
	variant?: AlertVariant;
	children: ReactNode;
}

export function Alert({ variant = 'danger', children }: AlertProps) {
	return (
		<div className={`rounded-md p-4 text-sm ${variantClasses[variant]}`}>
			{children}
		</div>
	);
}
