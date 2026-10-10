import { Badge } from '../../../components/ui/Badge';
import { seriesStatusLabel } from '../lib/formatSeries';

const VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = { continuing: 'success', upcoming: 'warning' };

/** Continuing is the one worth noticing (new episodes coming), so it alone gets color. */
export function SeriesStatusBadge({ status }: { status: string }) {
	return <Badge variant={VARIANT[status] ?? 'neutral'}>{seriesStatusLabel(status)}</Badge>;
}
