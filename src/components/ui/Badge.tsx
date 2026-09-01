import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
	success: 'bg-success-bg text-success',
	danger: 'bg-danger-bg text-danger',
	warning: 'bg-warning-bg text-warning',
	neutral: 'bg-surface-raised text-text-muted'
};

interface BadgeProps {
	variant: BadgeVariant;
	children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${variantClasses[variant]}`}
		>
			{children}
		</span>
	);
}
