import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-white hover:bg-accent/90',
	secondary: 'border border-border text-text hover:bg-surface-raised',
	danger: 'bg-danger text-white hover:bg-danger/90',
	ghost: 'text-text-muted hover:bg-surface-raised'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
	return (
		<button
			className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
			{...props}
		/>
	);
}
