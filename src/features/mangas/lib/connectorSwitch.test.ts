import { describe, expect, it } from 'vitest'
import { describeDisabled } from './connectorSwitch'

describe('describeDisabled', () => {
  it('joins date and reason', () => {
    expect(describeDisabled({ disabledAt: '2026-11-14T15:00:00.000Z', disabledReason: 'paywall' })).toBe(
      'desligado em 14/11/2026 — paywall'
    )
  })

  it('omits a missing reason', () => {
    expect(describeDisabled({ disabledAt: '2026-11-14T15:00:00.000Z', disabledReason: null })).toBe(
      'desligado em 14/11/2026'
    )
  })

  it('falls back when the date is missing', () => {
    expect(describeDisabled({ disabledAt: null, disabledReason: null })).toBe('conector desligado')
  })
})
