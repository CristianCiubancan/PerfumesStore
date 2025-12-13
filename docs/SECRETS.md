# Secret Management Guide

This document describes how to manage secrets for the Perfumes Store application across different deployment environments.

## Overview

The application supports multiple secret management approaches:

1. **Environment Variables** - Simple, works everywhere
2. **Docker Swarm Secrets** - Secure secret management for Docker Swarm deployments
3. **Cloud Secret Managers** - AWS Secrets Manager, HashiCorp Vault, etc.

## Required Secrets

| Secret Name | Description | Required |
|------------|-------------|----------|
| `JWT_SECRET` | JWT token signing secret (min 32 chars) | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret | No |
| `RESEND_API_KEY` | Resend email API key | No |

## Development Setup

For local development, use a `.env` file:

```bash
# Copy example and fill in values
cp .env.example .env

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

## Docker Compose (Simple Production)

For simple Docker Compose deployments, use environment variables in `.env`:

```bash
# .env file
JWT_SECRET=your-secure-jwt-secret-at-least-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-secret-at-least-32-chars
POSTGRES_PASSWORD=your-secure-database-password
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Docker Swarm Secrets

For Docker Swarm deployments, use Docker secrets for better security:

### Create Secrets

```bash
# Create secrets from command line (less secure - visible in history)
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-refresh-secret" | docker secret create jwt_refresh_secret -
echo "your-postgres-password" | docker secret create postgres_password -
echo "your-stripe-key" | docker secret create stripe_secret_key -
echo "your-webhook-secret" | docker secret create stripe_webhook_secret -
echo "your-resend-key" | docker secret create resend_api_key -

# Create secrets from files (more secure)
docker secret create jwt_secret ./secrets/jwt_secret.txt
docker secret create postgres_password ./secrets/postgres_password.txt
```

### Deploy Stack

```bash
docker stack deploy -c docker-compose.swarm.yml perfumes-store
```

### Manage Secrets

```bash
# List secrets
docker secret ls

# Inspect secret (metadata only)
docker secret inspect jwt_secret

# Rotate a secret
docker secret rm jwt_secret
echo "new-secret-value" | docker secret create jwt_secret -
docker service update --secret-rm jwt_secret --secret-add jwt_secret perfumes-store_server
```

## AWS Secrets Manager

For AWS deployments, you can use AWS Secrets Manager:

### Store Secrets

```bash
# Create a secret
aws secretsmanager create-secret \
  --name perfumes-store/production \
  --secret-string '{"JWT_SECRET":"...","JWT_REFRESH_SECRET":"...","POSTGRES_PASSWORD":"..."}'

# Or store individual secrets
aws secretsmanager create-secret --name perfumes-store/jwt-secret --secret-string "your-secret"
```

### Retrieve in Application

Add AWS SDK and modify your startup:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function loadAWSSecrets() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "perfumes-store/production" })
  );
  const secrets = JSON.parse(response.SecretString!);

  // Set as environment variables
  process.env.JWT_SECRET = secrets.JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET;
  // ... etc
}
```

### IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:perfumes-store/*"
    }
  ]
}
```

## HashiCorp Vault

For Vault-based secret management:

### Store Secrets

```bash
# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Store secrets
vault kv put secret/perfumes-store/production \
  JWT_SECRET="..." \
  JWT_REFRESH_SECRET="..." \
  POSTGRES_PASSWORD="..."
```

### Retrieve Secrets

Use the Vault Agent or SDK:

```typescript
import Vault from 'node-vault';

async function loadVaultSecrets() {
  const vault = Vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  });

  const result = await vault.read('secret/data/perfumes-store/production');
  const secrets = result.data.data;

  process.env.JWT_SECRET = secrets.JWT_SECRET;
  // ... etc
}
```

## Kubernetes Secrets

For Kubernetes deployments:

### Create Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: perfumes-store-secrets
type: Opaque
stringData:
  JWT_SECRET: "your-jwt-secret"
  JWT_REFRESH_SECRET: "your-refresh-secret"
  POSTGRES_PASSWORD: "your-db-password"
  STRIPE_SECRET_KEY: "sk_live_..."
```

```bash
kubectl apply -f secrets.yaml
```

### Use in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: server
          envFrom:
            - secretRef:
                name: perfumes-store-secrets
```

## Using the Secrets Utility

The application includes a secrets utility (`server/src/lib/secrets.ts`) that automatically reads from Docker secrets when available:

```typescript
import { getSecret, getRequiredSecret, validateSecrets } from './lib/secrets';

// Get optional secret
const resendKey = getSecret('RESEND_API_KEY');

// Get required secret (throws if not found)
const jwtSecret = getRequiredSecret('JWT_SECRET');

// Validate all required secrets at startup
validateSecrets(['JWT_SECRET', 'JWT_REFRESH_SECRET', 'POSTGRES_PASSWORD']);

// Get secret sources for debugging (does not expose values)
const sources = getSecretSources();
// { JWT_SECRET: 'docker-secret', STRIPE_SECRET_KEY: 'environment', ... }
```

## Security Best Practices

1. **Never commit secrets** - Use `.gitignore` for `.env` files and secret directories
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Rotate regularly** - Change secrets periodically, especially after team changes
4. **Limit access** - Only grant secret access to services that need them
5. **Audit access** - Log and monitor secret access
6. **Use separate secrets per environment** - Different secrets for dev/staging/production
7. **Encrypt at rest** - Use encrypted storage for secret files
8. **Encrypt in transit** - Always use TLS/HTTPS

## Troubleshooting

### Secret not found
```
Error: Required secret "JWT_SECRET" not found
```
- Check if secret is created: `docker secret ls`
- Check if service has access to secret
- Verify secret name matches (case-sensitive)

### Permission denied reading secret
```
Error: EACCES: permission denied, open '/run/secrets/jwt_secret'
```
- Ensure container runs with correct user
- Check secret file permissions

### Docker secrets not available
- Docker secrets only work in Swarm mode
- Run `docker swarm init` first
- Secrets are mounted at `/run/secrets/`
