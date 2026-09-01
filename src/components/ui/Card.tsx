import type { HTMLAttributes } from 'react';

type CardPadding = 'sm' | 'md' | 'lg';

const paddingClasses: Record<CardPadding, string> = {
	sm: 'p-4',
	md: 'p-6',
	lg: 'p-8'
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	padding?: CardPadding;
}

export function Card({ padding = 'md', className = '', ...props }: CardProps) {
	return (
		<div
			className={`rounded-lg border border-border bg-surface ${paddingClasses[padding]} ${className}`}
			{...props}
		/>
	);
}
