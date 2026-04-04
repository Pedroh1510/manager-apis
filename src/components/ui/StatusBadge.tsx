type Status = 'online' | 'offline' | 'loading';

const statusConfig: Record<Status, { label: string; className: string }> = {
	online: { label: 'Online', className: 'bg-green-100 text-green-800' },
	offline: { label: 'Offline', className: 'bg-red-100 text-red-800' },
	loading: {
		label: 'Verificando...',
		className: 'bg-yellow-100 text-yellow-800'
	}
};

interface StatusBadgeProps {
	status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	const { label, className } = statusConfig[status];
	return (
		<span
			className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}
		>
			{label}
		</span>
	);
}
