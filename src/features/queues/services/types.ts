/** One BullMQ queue as both APIs' `GET /queues-summary` return it. */
export interface QueueSummary {
	name: string;
	counts: {
		active: number;
		waiting: number;
		delayed: number;
		failed: number;
		completed: number;
		paused: number;
	};
}

export type QueuesApi = 'mangas' | 'anime-rss';
