import fs from 'fs'
import path from 'path'

/**
 * Secret management utility for loading secrets from various sources.
 *
 * Supported sources (in order of priority):
 * 1. Docker Swarm secrets (/run/secrets/*)
 * 2. Environment variables
 * 3. .env file values
 *
 * Usage:
 *   const dbPassword = getSecret('POSTGRES_PASSWORD')
 *   const jwtSecret = getSecret('JWT_SECRET', { required: true })
 */

const DOCKER_SECRETS_PATH = '/run/secrets'

interface GetSecretOptions {
  required?: boolean
  defaultValue?: string
}

/**
 * Check if Docker secrets directory exists (running in Docker Swarm mode).
 */
export function isDockerSecretsAvailable(): boolean {
  try {
    return fs.existsSync(DOCKER_SECRETS_PATH) && fs.statSync(DOCKER_SECRETS_PATH).isDirectory()
  } catch {
    return false
  }
}

/**
 * Read a secret from Docker Swarm secrets.
 * Secrets are mounted as files at /run/secrets/<secret_name>
 */
function readDockerSecret(secretName: string): string | undefined {
  const secretPath = path.join(DOCKER_SECRETS_PATH, secretName.toLowerCase())
  try {
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim()
    }
  } catch {
    // Failed to read secret file
  }
  return undefined
}

/**
 * Get a secret value from available sources.
 *
 * Sources checked in order:
 * 1. Docker Swarm secrets (/run/secrets/<name>)
 * 2. Environment variable
 * 3. Default value (if provided)
 *
 * @param name - The secret name (environment variable name)
 * @param options - Configuration options
 * @returns The secret value
 * @throws Error if required and not found
 */
export function getSecret(name: string, options: GetSecretOptions = {}): string | undefined {
  const { required = false, defaultValue } = options

  // Try Docker Swarm secrets first
  let value = readDockerSecret(name)

  // Fall back to environment variable
  if (value === undefined) {
    value = process.env[name]
  }

  // Use default if no value found
  if (value === undefined && defaultValue !== undefined) {
    value = defaultValue
  }

  // Check if required
  if (required && value === undefined) {
    throw new Error(`Required secret "${name}" not found in Docker secrets or environment variables`)
  }

  return value
}

/**
 * Get a required secret (throws if not found).
 */
export function getRequiredSecret(name: string): string {
  const value = getSecret(name, { required: true })
  return value as string
}

/**
 * Load multiple secrets at once.
 *
 * @param secretNames - Array of secret names to load
 * @returns Object with secret names as keys and values
 */
export function loadSecrets<T extends string>(secretNames: T[]): Record<T, string | undefined> {
  const secrets: Record<string, string | undefined> = {}
  for (const name of secretNames) {
    secrets[name] = getSecret(name)
  }
  return secrets as Record<T, string | undefined>
}

/**
 * Validate that all required secrets are present.
 *
 * @param requiredSecrets - Array of required secret names
 * @throws Error listing all missing secrets
 */
export function validateSecrets(requiredSecrets: string[]): void {
  const missing: string[] = []

  for (const name of requiredSecrets) {
    if (getSecret(name) === undefined) {
      missing.push(name)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`)
  }
}

/**
 * Get secret source information for logging/debugging.
 * Does NOT return actual secret values.
 */
export function getSecretSources(): Record<string, string> {
  const sources: Record<string, string> = {}

  // List of secrets we care about
  const secretNames = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'POSTGRES_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
  ]

  for (const name of secretNames) {
    if (readDockerSecret(name) !== undefined) {
      sources[name] = 'docker-secret'
    } else if (process.env[name]) {
      sources[name] = 'environment'
    } else {
      sources[name] = 'not-set'
    }
  }

  return sources
}

/**
 * Mask a secret value for safe logging.
 */
export function maskSecret(value: string | undefined): string {
  if (!value) return '[not set]'
  if (value.length <= 8) return '****'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
