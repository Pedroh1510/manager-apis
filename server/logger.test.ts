// @vitest-environment node
import { trace } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createJsonLogger } from './logger.js'

describe('json logger', () => {
  let provider: NodeTracerProvider

  beforeAll(() => {
    provider = new NodeTracerProvider()
    provider.register()
  })

  afterAll(async () => {
    await provider.shutdown()
    trace.disable()
  })

  it('writes level msg time and the context', () => {
    const lines: string[] = []
    createJsonLogger((line) => lines.push(line)).info('server started', { port: 3002 })
    const line = JSON.parse(lines[0])
    expect(line).toMatchObject({ level: 'info', msg: 'server started', port: 3002 })
    expect(new Date(line.time).toISOString()).toBe(line.time)
  })

  it('log line carries active span ids', () => {
    const lines: string[] = []
    const logger = createJsonLogger((line) => lines.push(line))
    let spanContext = trace.getTracer('test').startSpan('x').spanContext()
    trace.getTracer('test').startActiveSpan('request', (span) => {
      spanContext = span.spanContext()
      logger.error('sonarr request failed', { path: '/api/sonarr/series' })
      span.end()
    })
    logger.info('outside span')
    const [inside, outside] = lines.map((line) => JSON.parse(line))
    expect(inside.trace_id).toBe(spanContext.traceId)
    expect(inside.span_id).toBe(spanContext.spanId)
    expect(outside).not.toHaveProperty('trace_id')
    expect(outside).not.toHaveProperty('span_id')
  })
})
