import type { HTMLAttributes } from 'react';

type CardPadding = 'sm' | 'md' | 'lg';

const paddingClasses: Record<CardPadding, string> = {
	sm: 'p-3',
	md: 'p-4',
	lg: 'p-6'
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	padding?: CardPadding;
}

export function Card({ padding = 'md', className = '', ...props }: CardProps) {
	return (
		<div
			className={`rounded-lg border border-border bg-surface shadow-raised ${paddingClasses[padding]} ${className}`}
			{...props}
		/>
	);
}
