import { Badge } from './Badge';

type ServiceStatus = 'online' | 'offline' | 'loading';
type MangaStatus = 'active' | 'partial' | 'inactive';
type Status = ServiceStatus | MangaStatus;

const statusConfig: Record<Status, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
	online: { label: 'Online', variant: 'success' },
	offline: { label: 'Offline', variant: 'danger' },
	loading: { label: 'Verificando...', variant: 'warning' },
	active: { label: 'Ativo', variant: 'success' },
	partial: { label: 'Parcial', variant: 'warning' },
	inactive: { label: 'Inativo', variant: 'danger' }
};

interface StatusBadgeProps {
	status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	const { label, variant } = statusConfig[status];
	return <Badge variant={variant}>{label}</Badge>;
}
