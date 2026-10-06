import type { ButtonHTMLAttributes } from 'react';
import { FOCUS_RING } from './focusRing';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-white shadow-raised hover:bg-accent/90 active:bg-accent/80',
	secondary:
		'border border-border bg-surface text-text shadow-raised hover:bg-surface-raised active:bg-border/60',
	danger: 'bg-danger text-white shadow-raised hover:bg-danger/90 active:bg-danger/80',
	ghost: 'text-text-muted hover:bg-surface-raised hover:text-text active:bg-border/60'
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'h-7 px-2.5 text-xs',
	md: 'h-8 px-3 text-sm'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function Button({
	variant = 'secondary',
	size = 'md',
	className = '',
	...props
}: ButtonProps) {
	return (
		<button
			className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
			{...props}
		/>
	);
}
