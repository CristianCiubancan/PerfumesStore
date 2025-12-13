import { Router, Request, Response } from 'express'
import { getMetrics, getMetricsContentType } from '../lib/metrics'

const router = Router()

/**
 * GET /metrics
 * Prometheus metrics endpoint.
 * Returns metrics in Prometheus exposition format.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics()
    res.set('Content-Type', getMetricsContentType())
    res.send(metrics)
  } catch {
    res.status(500).send('Error collecting metrics')
  }
})

export default router
