import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import { trace, SpanStatusCode, context, SpanKind, Span } from '@opentelemetry/api'
import { logger } from './logger'

let sdk: NodeSDK | null = null

/**
 * Initialize OpenTelemetry SDK for distributed tracing.
 * Must be called BEFORE importing other modules (especially http, express, pg).
 *
 * Supports OTLP exporter for production backends like:
 * - Jaeger (http://localhost:4318)
 * - Zipkin (via OTLP bridge)
 * - Honeycomb, Datadog, New Relic, etc.
 */
export function initTracing(): void {
  const enabled = process.env.OTEL_ENABLED === 'true'
  if (!enabled) {
    logger.info('[Tracing] OpenTelemetry disabled (set OTEL_ENABLED=true to enable)')
    return
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'perfumes-store-api'
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  const environment = process.env.NODE_ENV || 'development'

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
  })

  const traceExporter = endpoint
    ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })
    : undefined

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // Configure HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (request) => {
            // Ignore health check and metrics endpoints
            const url = request.url || ''
            return url.includes('/health') || url.includes('/metrics') || url.includes('/ready')
          },
        },
      }),
    ],
  })

  sdk.start()

  logger.info(`[Tracing] OpenTelemetry initialized for ${serviceName}`)
  if (endpoint) {
    logger.info(`[Tracing] Exporting traces to ${endpoint}`)
  } else {
    logger.info('[Tracing] No OTLP endpoint configured, traces will not be exported')
  }

  // Graceful shutdown
  process.on('SIGTERM', () => shutdown())
  process.on('SIGINT', () => shutdown())
}

/**
 * Shutdown the OpenTelemetry SDK gracefully.
 */
export async function shutdown(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown()
      logger.info('[Tracing] OpenTelemetry shut down successfully')
    } catch (error) {
      logger.error('[Tracing] Error shutting down OpenTelemetry:', error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Get the current tracer for manual instrumentation.
 */
export function getTracer(name = 'app') {
  return trace.getTracer(name)
}

/**
 * Create a child span for manual instrumentation.
 * Useful for tracing specific operations like database queries, external API calls, etc.
 *
 * @example
 * const result = await withSpan('process-order', async (span) => {
 *   span.setAttribute('order.id', orderId)
 *   return await processOrder(orderId)
 * })
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: { kind?: SpanKind; attributes?: Record<string, string | number | boolean> }
): Promise<T> {
  const tracer = getTracer()
  const span = tracer.startSpan(name, {
    kind: options?.kind || SpanKind.INTERNAL,
    attributes: options?.attributes,
  })

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      if (error instanceof Error) {
        span.recordException(error)
      }
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Add attributes to the current span (if one exists).
 * Useful for enriching traces with business context.
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan()
  if (span) {
    span.setAttributes(attributes)
  }
}

/**
 * Record an exception on the current span.
 */
export function recordException(error: Error): void {
  const span = trace.getActiveSpan()
  if (span) {
    span.recordException(error)
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
  }
}

/**
 * Get the current trace ID for correlation with logs.
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan()
  return span?.spanContext().traceId
}

/**
 * Get the current span ID.
 */
export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan()
  return span?.spanContext().spanId
}
