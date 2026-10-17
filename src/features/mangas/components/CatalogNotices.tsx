interface CatalogNoticesProps {
	notices: string[];
}

/**
 * Warning banner listing the plugins left out of a catalog load.
 * @example <CatalogNotices notices={['Falha ao carregar: Mangeek.']} />
 */
export function CatalogNotices({ notices }: CatalogNoticesProps) {
	if (notices.length === 0) return null;
	return (
		<div role='status' className='space-y-1 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning'>
			{notices.map((notice) => (
				<p key={notice}>{notice}</p>
			))}
		</div>
	);
}
