import type { PrefsStorage } from '../features/sonarr/lib/addSeriesPrefs'

/**
 * In-memory stand-in for localStorage; `failing` makes every call throw like a blocked storage.
 * @example const storage = new MemoryPrefsStorage({ 'sonarr.addSeries.prefs': '{}' })
 */
export class MemoryPrefsStorage implements PrefsStorage {
  private readonly items: Map<string, string>
  private readonly failing: boolean

  constructor(initial: Record<string, string> = {}, failing = false) {
    this.items = new Map(Object.entries(initial))
    this.failing = failing
  }

  getItem(key: string): string | null {
    if (this.failing) throw new Error('storage blocked')
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.failing) throw new Error('storage blocked')
    this.items.set(key, value)
  }
}
