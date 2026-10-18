// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { RateLimiter, type RateWindow } from './rateLimiter.js'

/** A clock whose `sleep` only advances time, so the windows are tested without waiting. */
class FakeLimiterClock {
  current = 0
  now = () => this.current
  sleep = async (ms: number) => {
    this.current += ms
  }
}

async function acquireTimes(limiter: RateLimiter, clock: FakeLimiterClock, count: number): Promise<number[]> {
  const times: number[] = []
  for (let call = 0; call < count; call++) {
    await limiter.acquire()
    times.push(clock.now())
  }
  return times
}

const THREE_PER_SECOND_SIXTY_PER_MINUTE: RateWindow[] = [{ limit: 3, ms: 1000 }, { limit: 60, ms: 60000 }]

describe('RateLimiter', () => {
  it('holds the 4th call in a 1 second window', async () => {
    const clock = new FakeLimiterClock()
    const limiter = new RateLimiter(clock, THREE_PER_SECOND_SIXTY_PER_MINUTE)

    const times = await Promise.all([1, 2, 3, 4].map(() => limiter.acquire().then(clock.now)))

    expect(times).toEqual([0, 0, 0, 1000])
  })

  it('holds the 61st call in a 60 second window', async () => {
    const clock = new FakeLimiterClock()
    const times = await acquireTimes(new RateLimiter(clock, THREE_PER_SECOND_SIXTY_PER_MINUTE), clock, 61)

    expect(times[59]).toBe(19000)
    expect(times[60]).toBe(60000)
  })

  it('anilist windows hold the 3rd call in a second and the 31st in a minute', async () => {
    const burst = new FakeLimiterClock()
    const burstLimiter = new RateLimiter(burst)
    expect(await Promise.all([1, 2, 3].map(() => burstLimiter.acquire().then(burst.now)))).toEqual([0, 0, 1000])

    const clock = new FakeLimiterClock()
    const times = await acquireTimes(new RateLimiter(clock), clock, 31)
    expect(times[29]).toBe(14000)
    expect(times[30]).toBe(60000)
  })
})
