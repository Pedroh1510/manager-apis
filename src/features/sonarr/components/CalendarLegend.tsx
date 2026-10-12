import { CALENDAR_STATUSES, CALENDAR_STATUS_DOT, CALENDAR_STATUS_LABEL } from './calendarStatusStyle';

/** The four colors of the calendar, same marks as the items. */
export function CalendarLegend() {
	return (
		<ul aria-label='Legenda' className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted'>
			{CALENDAR_STATUSES.map((status) => (
				<li key={status} data-status={status} className='flex items-center gap-1.5'>
					<span aria-hidden='true' className={`h-2 w-2 rounded-full ${CALENDAR_STATUS_DOT[status]}`} />
					{CALENDAR_STATUS_LABEL[status]}
				</li>
			))}
		</ul>
	);
}
