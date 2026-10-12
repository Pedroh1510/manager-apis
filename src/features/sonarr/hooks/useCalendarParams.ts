import { useSearchParams } from 'react-router-dom';
import { parseWeekParam, type DayKey } from '../lib/calendarWeek';

export interface CalendarParams {
	/** Sunday of the shown week */
	week: DayKey;
	showUnmonitored: boolean;
	/** null goes back to the current week and drops `semana` from the URL */
	goToWeek: (week: DayKey | null) => void;
	setShowUnmonitored: (show: boolean) => void;
}

/**
 * Calendar state lives in the URL (`?semana=&naoMonitorados=1`, door 4); defaults stay out of it.
 * @example const { week, goToWeek } = useCalendarParams()
 */
export function useCalendarParams(): CalendarParams {
	const [search, setSearch] = useSearchParams();

	function setParam(key: 'semana' | 'naoMonitorados', value: string | null) {
		setSearch((current) => {
			const next = new URLSearchParams(current);
			if (value) next.set(key, value);
			else next.delete(key);
			return next;
		}, { replace: true });
	}

	return {
		week: parseWeekParam(search.get('semana'), new Date()),
		showUnmonitored: search.get('naoMonitorados') === '1',
		goToWeek: (week) => setParam('semana', week),
		setShowUnmonitored: (show) => setParam('naoMonitorados', show ? '1' : null)
	};
}
