/** Time source and wait, injected so the windows are testable without real waits. */
export interface LimiterClock {
  now(): number
  sleep(ms: number): Promise<void>
}

export interface RateWindow {
  limit: number
  ms: number
}

/** Jikan's published limits: 3 requests per second and 60 per minute. */
export const JIKAN_RATE_WINDOWS: RateWindow[] = [{ limit: 3, ms: 1000 }, { limit: 60, ms: 60000 }]

export const realClock: LimiterClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/**
 * One per process, shared by every Jikan call (door 3): a call over a window waits, never fails.
 * @example await limiter.acquire(); await fetch(url)
 */
export class JikanRateLimiter {
  private readonly calls: number[] = []
  // Callers queue up so two waiting calls never claim the same freed slot.
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private readonly clock: LimiterClock = realClock,
    private readonly windows: RateWindow[] = JIKAN_RATE_WINDOWS,
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
