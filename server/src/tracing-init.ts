/**
 * OpenTelemetry initialization file.
 * Must be loaded BEFORE all other imports to enable auto-instrumentation.
 *
 * Usage (development):
 *   NODE_OPTIONS="--require ./src/tracing-init.ts" npm run dev
 *
 * Usage (production):
 *   NODE_OPTIONS="--require ./dist/tracing-init.js" npm start
 */

import { initTracing } from './lib/tracing'

initTracing()
