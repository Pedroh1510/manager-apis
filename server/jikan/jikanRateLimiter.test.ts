// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { JikanRateLimiter } from './jikanRateLimiter.js'

/** A clock whose `sleep` only advances time, so the windows are tested without waiting. */
class FakeLimiterClock {
  current = 0
  readonly sleeps: number[] = []
  now = () => this.current
  sleep = async (ms: number) => {
    this.sleeps.push(ms)
    this.current += ms
  }
}

async function acquireTimes(limiter: JikanRateLimiter, clock: FakeLimiterClock, count: number): Promise<number[]> {
  const times: number[] = []
  for (let call = 0; call < count; call++) {
    await limiter.acquire()
    times.push(clock.now())
  }
  return times
}

describe('JikanRateLimiter', () => {
  it('holds the 4th call in a 1 second window', async () => {
    const clock = new FakeLimiterClock()
    const limiter = new JikanRateLimiter(clock)

    const times = await Promise.all([1, 2, 3, 4].map(() => limiter.acquire().then(clock.now)))

    expect(times).toEqual([0, 0, 0, 1000])
  })

  it('holds the 61st call in a 60 second window', async () => {
    const clock = new FakeLimiterClock()
    const limiter = new JikanRateLimiter(clock)

    const times = await acquireTimes(limiter, clock, 61)

    expect(times[59]).toBe(19000)
    expect(times[60]).toBe(60000)
  })
})
