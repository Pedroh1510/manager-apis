// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toCommandState } from './manualImport.js'

describe('toCommandState', () => {
  it('maps every sonarr command status to pending, completed or failed', () => {
    expect(toCommandState({ status: 'queued' })).toEqual({ state: 'pending', message: null })
    expect(toCommandState({ status: 'started', message: 'Importing' })).toEqual({ state: 'pending', message: 'Importing' })
    expect(toCommandState({ status: 'completed', result: 'successful', message: 'Manually imported 1 files' }))
      .toEqual({ state: 'completed', message: 'Manually imported 1 files' })
    for (const command of [
      { status: 'completed', result: 'unsuccessful' }, { status: 'failed' }, { status: 'aborted' },
      { status: 'cancelled' }, { status: 'orphaned' },
    ]) {
      expect(toCommandState(command), JSON.stringify(command)).toEqual({ state: 'failed', message: null })
    }
  })
})
