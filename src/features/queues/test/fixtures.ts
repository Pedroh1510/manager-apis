import type { QueueSummary } from '../services/types'

export function queue(name: string, counts: Partial<QueueSummary['counts']> = {}): QueueSummary {
  return { name, counts: { active: 0, waiting: 0, delayed: 0, failed: 0, completed: 0, paused: 0, ...counts } }
}
