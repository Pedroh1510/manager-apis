import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QueueCards } from './QueueCards'
import { queue } from '../test/fixtures'

describe('QueueCards', () => {
  it('shows counts and highlights queues with failed jobs', () => {
    render(
      <QueueCards
        queues={[queue('download', { active: 1, waiting: 2 }), queue('connector-mangeek', { delayed: 4, failed: 3 })]}
      />
    )

    const download = screen.getByTestId('queue-card-download')
    const mangeek = screen.getByTestId('queue-card-connector-mangeek')
    for (const [card, values] of [
      [download, { active: '1', waiting: '2', delayed: '0', failed: '0' }],
      [mangeek, { active: '0', waiting: '0', delayed: '4', failed: '3' }],
    ] as const) {
      for (const [key, value] of Object.entries(values)) {
        expect(within(card).getByTestId(`count-${key}`)).toHaveTextContent(value)
      }
    }
    expect(mangeek.className).toMatch(/border-danger/)
    expect(download.className).not.toMatch(/border-danger/)
  })
})
