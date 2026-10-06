import type { ReactNode } from 'react';

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
}

/**
 * Page title row shared by every screen: title, one muted line, actions right.
 * @example <PageHeader title='Mangás' subtitle='4 de 4 mangás' actions={<Button>…</Button>} />
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
	return (
		<header className='mb-5 flex items-end justify-between gap-4'>
			<div>
				<h1 className='text-xl font-semibold tracking-tight text-text'>{title}</h1>
				{subtitle && <p className='mt-0.5 text-xs text-text-muted'>{subtitle}</p>}
			</div>
			{actions && <div className='flex items-center gap-2'>{actions}</div>}
		</header>
	);
}
