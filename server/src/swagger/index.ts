import swaggerUi from 'swagger-ui-express'
import express from 'express'
import openApiSpec from './openapi.json'

const router = express.Router()

// Swagger UI options
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Perfumes Store API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
}

// Serve OpenAPI spec as JSON
router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec)
})

// Setup Swagger UI - cast to any to avoid type conflicts between express versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.use('/', swaggerUi.serve as any, swaggerUi.setup(openApiSpec, swaggerUiOptions) as any)

export default router
