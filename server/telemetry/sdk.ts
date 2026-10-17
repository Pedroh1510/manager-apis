import { metrics } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SERVICE_NAME, type TelemetryConfig } from './config.js'

const EXPORT_INTERVAL_MS = 30_000
// Short, so an unreachable collector costs a bounded wait per export, never
// the request path (AC 19)
const EXPORT_TIMEOUT_MS = 5_000

/**
 * HTTP in, and out through fetch (the Sonarr, Tdarr and qBittorrent gateways
 * all use it), plus Express routes (plan doors 4 and 4b). No database, no queue.
 */
export function createInstrumentations() {
  // stable HTTP semconv: http.server/client.request.duration, server.address
  process.env.OTEL_SEMCONV_STABILITY_OPT_IN ??= 'http'
  return [new HttpInstrumentation(), new UndiciInstrumentation(), new ExpressInstrumentation()]
}

function registerHeartbeat(): void {
  metrics
    .getMeter(SERVICE_NAME)
    .createObservableGauge('app.telemetry.up', { description: 'Always 1 while the process exports telemetry' })
    .addCallback((result) => result.observe(1))
}

/**
 * Starts the OpenTelemetry SDK: traces and metrics over OTLP HTTP to
 * `endpoint`, no OTLP logs (logs stay JSON on stdout, plan door 3). Export
 * failures are dropped by the SDK and never reach the app.
 * @example const sdk = startTelemetry(resolveTelemetryConfig(process.env))
 */
export function startTelemetry(
  { serviceName, endpoint }: TelemetryConfig,
  { exportIntervalMillis = EXPORT_INTERVAL_MS }: { exportIntervalMillis?: number } = {},
): NodeSDK {
  process.env.OTEL_LOGS_EXPORTER ??= 'none'
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ 'service.name': serviceName }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces`, timeoutMillis: EXPORT_TIMEOUT_MS }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics`, timeoutMillis: EXPORT_TIMEOUT_MS }),
      exportIntervalMillis,
      exportTimeoutMillis: Math.min(EXPORT_TIMEOUT_MS, exportIntervalMillis),
    }),
    logRecordProcessors: [],
    instrumentations: createInstrumentations(),
  })
  sdk.start()
  registerHeartbeat()
  return sdk
}
