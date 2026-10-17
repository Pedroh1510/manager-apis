// Loaded with `node --import ./dist-server/telemetry.js` (app-observability
// door 5), so the SDK patches express before the app imports it.
import { register } from 'node:module'
import { resolveTelemetryConfig } from './telemetry/config.js'
import { startTelemetry } from './telemetry/sdk.js'

// express is CommonJS imported from ESM: the hook lets the instrumentation
// patch it on import
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url)

const sdk = startTelemetry(resolveTelemetryConfig(process.env))

process.once('beforeExit', () => {
  sdk.shutdown().catch(() => {})
})
