import { metrics } from '@opentelemetry/api'
import { AggregationTemporality, MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics'

class CollectingReader extends MetricReader {
  constructor() {
    super({ aggregationTemporalitySelector: () => AggregationTemporality.CUMULATIVE })
  }

  protected async onForceFlush(): Promise<void> {}

  protected async onShutdown(): Promise<void> {}
}

export interface DataPoint {
  attributes: Record<string, unknown>
  value: unknown
}

/**
 * An in-memory global meter provider whose data points can be read back; call uninstall() after.
 * @example const meters = installMeterProvider(); await meters.points('apis.series.added')
 */
export function installMeterProvider() {
  const reader = new CollectingReader()
  const provider = new MeterProvider({ readers: [reader] })
  metrics.setGlobalMeterProvider(provider)
  return {
    async points(name: string): Promise<DataPoint[]> {
      const { resourceMetrics } = await reader.collect()
      return resourceMetrics.scopeMetrics
        .flatMap((scope) => scope.metrics)
        .filter((metric) => metric.descriptor.name === name)
        .flatMap((metric) => metric.dataPoints as DataPoint[])
    },
    async uninstall() {
      await provider.shutdown()
      metrics.disable()
    },
  }
}
