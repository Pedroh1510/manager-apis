import { Badge } from './Badge';

type Status = 'online' | 'offline' | 'loading';

const statusConfig: Record<Status, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
	online: { label: 'Online', variant: 'success' },
	offline: { label: 'Offline', variant: 'danger' },
	loading: { label: 'Verificando...', variant: 'warning' }
};

interface StatusBadgeProps {
	status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	const { label, variant } = statusConfig[status];
	return <Badge variant={variant}>{label}</Badge>;
}
