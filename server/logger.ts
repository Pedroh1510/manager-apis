import { isSpanContextValid, trace } from '@opentelemetry/api'

export type LogContext = Record<string, string | number | boolean | Record<string, boolean>>

export interface JsonLogger {
  info(msg: string, context?: LogContext): void
  error(msg: string, context?: LogContext): void
}

export type LineWriter = (line: string) => void

const writeStdout: LineWriter = (line) => process.stdout.write(`${line}\n`)

// app-observability door 3: the collector copies trace_id/span_id into the
// log record, linking the line to its trace
function activeSpanIds(): Record<string, string> {
  const spanContext = trace.getActiveSpan()?.spanContext()
  if (!spanContext || !isSpanContextValid(spanContext)) return {}
  return { trace_id: spanContext.traceId, span_id: spanContext.spanId }
}

/**
 * One JSON object per line on stdout, so Coolify/Loki can parse it without a log library.
 * @example createJsonLogger().info('server started', { port: 3002 })
 */
export function createJsonLogger(write: LineWriter = writeStdout): JsonLogger {
  const log = (level: string, msg: string, context: LogContext = {}) =>
    write(JSON.stringify({ level, msg, ...context, time: new Date().toISOString(), ...activeSpanIds() }))
  return {
    info: (msg, context) => log('info', msg, context),
    error: (msg, context) => log('error', msg, context),
  }
}
