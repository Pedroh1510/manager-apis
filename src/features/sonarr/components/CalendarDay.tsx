import { Link } from 'react-router-dom';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import type { WeekDay } from '../lib/calendarWeek';
import type { CalendarGroup } from '../lib/groupCalendarItems';
import { CALENDAR_STATUS_STRIPE } from './calendarStatusStyle';

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const pad = (n: number) => String(n).padStart(2, '0');

/** @example dayLabel(new Date(2026, 9, 11)) // 'dom 11/10' */
function dayLabel(date: Date): string {
	return `${WEEKDAY_SHORT[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

function CalendarEntry({ group }: { group: CalendarGroup }) {
	return (
		<Link
			to={`/sonarr/${group.seriesId}`}
			data-status={group.status}
			className={`block rounded-md border border-l-4 border-border bg-surface px-2 py-1.5 text-xs shadow-raised transition-colors hover:bg-surface-raised ${CALENDAR_STATUS_STRIPE[group.status]} ${FOCUS_RING}`}
		>
			<span className='flex items-baseline justify-between gap-2'>
				<span className='truncate font-medium text-text'>{group.seriesTitle}</span>
				<span className='shrink-0 font-mono text-text-subtle'>{TIME.format(new Date(group.airDateUtc))}</span>
			</span>
			<span className='block font-mono text-text-muted'>{group.label}</span>
			{group.episodeTitle && <span className='block truncate text-text-muted'>{group.episodeTitle}</span>}
		</Link>
	);
}

interface CalendarDayProps {
	day: WeekDay;
	groups: CalendarGroup[];
	isToday: boolean;
}

/**
 * One day of the week: a column from `md` up, a stacked section on phones (decision Q6).
 * @example <CalendarDay day={day} groups={groupsOfDay} isToday={false} />
 */
export function CalendarDay({ day, groups, isToday }: CalendarDayProps) {
	const label = dayLabel(day.date);
	return (
		<section
			aria-label={label}
			aria-current={isToday ? 'date' : undefined}
			className={`min-w-0 rounded-lg border p-2 ${isToday ? 'border-accent bg-accent-muted/30' : 'border-border bg-canvas'}`}
		>
			<h2 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-accent' : 'text-text-muted'}`}>{label}</h2>
			{groups.length === 0 ? (
				<p className='text-xs text-text-subtle'>sem episódios</p>
			) : (
				<ul className='space-y-1.5'>
					{groups.map((group) => (
						<li key={group.key}>
							<CalendarEntry group={group} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
