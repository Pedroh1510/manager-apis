/** Time source and wait, injected so the windows are testable without real waits. */
export interface LimiterClock {
  now(): number
  sleep(ms: number): Promise<void>
}

export interface RateWindow {
  limit: number
  ms: number
}

/** AniList answered `x-ratelimit-limit: 30` on 2026-10-18 (its degraded mode); 2/s keeps under its burst limit (door 2). */
export const ANILIST_RATE_WINDOWS: RateWindow[] = [{ limit: 2, ms: 1000 }, { limit: 30, ms: 60000 }]

export const realClock: LimiterClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/**
 * One per process, shared by every upstream call (door 2): a call over a window waits, never fails.
 * @example await limiter.acquire(); await fetch(url)
 */
export class RateLimiter {
  private readonly calls: number[] = []
  // Callers queue up so two waiting calls never claim the same freed slot.
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private readonly clock: LimiterClock = realClock,
    private readonly windows: RateWindow[] = ANILIST_RATE_WINDOWS,
  ) {}

  acquire(): Promise<void> {
    const turn = this.queue.then(() => this.takeSlot())
    this.queue = turn
    return turn
  }

  private async takeSlot(): Promise<void> {
    for (let wait = this.waitMs(); wait > 0; wait = this.waitMs()) await this.clock.sleep(wait)
    const now = this.clock.now()
    this.calls.push(now)
    const longest = Math.max(...this.windows.map(({ ms }) => ms))
    while (this.calls.length && now - this.calls[0] >= longest) this.calls.shift()
  }

  /** How long until every window has room; 0 when one more call fits now. */
  private waitMs(): number {
    const now = this.clock.now()
    const waits = this.windows.map(({ limit, ms }) => {
      const inWindow = this.calls.filter((time) => now - time < ms)
      return inWindow.length < limit ? 0 : inWindow[inWindow.length - limit] + ms - now
    })
    return Math.max(0, ...waits)
  }
}
