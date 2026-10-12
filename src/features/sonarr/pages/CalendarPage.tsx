import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { CalendarDay } from '../components/CalendarDay';
import { CalendarLegend } from '../components/CalendarLegend';
import { SonarrError } from '../components/SonarrError';
import { useCalendarParams } from '../hooks/useCalendarParams';
import { localDayKey, shiftWeek, weekDays, weekWindow, type DayKey } from '../lib/calendarWeek';
import { groupCalendarItems } from '../lib/groupCalendarItems';
import { fetchCalendar } from '../services/api';
import type { CalendarItem } from '../services/types';

function WeekNavigation({ week, onGo }: { week: DayKey; onGo: (week: DayKey | null) => void }) {
	return (
		<div className='flex items-center gap-1'>
			<Button aria-label='Semana anterior' onClick={() => onGo(shiftWeek(week, -1))}>‹</Button>
			<Button onClick={() => onGo(null)}>Hoje</Button>
			<Button aria-label='Semana seguinte' onClick={() => onGo(shiftWeek(week, 1))}>›</Button>
		</div>
	);
}

function WeekGrid({ week, items }: { week: DayKey; items: CalendarItem[] }) {
	if (items.length === 0) return <p className='py-8 text-center text-sm text-text-muted'>Nenhum episódio nesta semana</p>;
	const groups = groupCalendarItems(items);
	const today = localDayKey(new Date().toISOString());
	return (
		<div className='grid gap-2 md:grid-cols-7'>
			{weekDays(week).map((day) => (
				<CalendarDay
					key={day.key}
					day={day}
					isToday={day.key === today}
					groups={groups.filter((group) => localDayKey(group.airDateUtc) === day.key)}
				/>
			))}
		</div>
	);
}

/**
 * Sonarr's calendar, one week Sunday to Saturday in the viewer's zone (decisions Q1, Q2, Q9).
 * @example <Route path='sonarr/calendario' element={<CalendarPage />} />
 */
export function CalendarPage() {
	const { week, showUnmonitored, goToWeek, setShowUnmonitored } = useCalendarParams();
	const query = { ...weekWindow(week), unmonitored: showUnmonitored };
	const calendar = useQuery({ queryKey: ['sonarr', 'calendar', query], queryFn: () => fetchCalendar(query) });
	return (
		<div className='mx-auto max-w-7xl space-y-4'>
			<PageHeader title='Calendário' actions={<WeekNavigation week={week} onGo={goToWeek} />} />
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<label className='flex items-center gap-2 text-sm text-text'>
					<input type='checkbox' checked={showUnmonitored} onChange={(event) => setShowUnmonitored(event.target.checked)} />
					Mostrar não monitorados
				</label>
				<CalendarLegend />
			</div>
			{calendar.isPending && <LoadingSpinner />}
			{calendar.isError && <SonarrError error={calendar.error} />}
			{calendar.data && <WeekGrid week={week} items={calendar.data} />}
		</div>
	);
}
