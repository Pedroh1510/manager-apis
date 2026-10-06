import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
	success: 'bg-success-bg text-success',
	danger: 'bg-danger-bg text-danger',
	warning: 'bg-warning-bg text-warning',
	neutral: 'bg-surface-raised text-text-muted'
};

const dotClasses: Record<BadgeVariant, string> = {
	success: 'bg-success',
	danger: 'bg-danger',
	warning: 'bg-warning',
	neutral: 'bg-text-subtle'
};

interface BadgeProps {
	variant: BadgeVariant;
	children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
		>
			<span aria-hidden='true' className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} />
			{children}
		</span>
	);
}
