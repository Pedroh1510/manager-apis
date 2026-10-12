/** Label over value pairs; tests read a value as the `dd` right after its `dt`. */
export function TdarrStatList({ rows, className = '' }: { rows: [string, string][]; className?: string }) {
	return (
		<dl className={`grid gap-x-6 gap-y-2 text-sm ${className}`}>
			{rows.map(([label, value]) => (
				<div key={label}>
					<dt className='text-[11px] font-medium uppercase tracking-wider text-text-subtle'>{label}</dt>
					<dd className='font-mono text-text'>{value}</dd>
				</div>
			))}
		</dl>
	);
}
