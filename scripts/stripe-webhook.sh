#!/bin/bash
#
# Stripe Webhook Listener Script for PerfumesStore
#
# This script starts the Stripe CLI webhook listener for local development
# and automatically updates the .env file if the webhook secret has changed.
#
# Usage:
#   ./scripts/stripe-webhook.sh
#
# The webhook signing secret persists across restarts but changes periodically
# (every few days or after re-authentication). This script auto-detects changes.
#
# Prerequisites:
#   - Stripe CLI installed (brew install stripe/stripe-cli/stripe)
#   - Stripe CLI authenticated (stripe login)
#

set -e

# Configuration
WEBHOOK_ENDPOINT="${WEBHOOK_ENDPOINT:-localhost:4000/api/checkout/webhook}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV_FILE="${ROOT_DIR}/.env"
SERVER_ENV_FILE="${ROOT_DIR}/server/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo -e "${RED}Error: Stripe CLI is not installed${NC}"
  echo ""
  echo "Install it with:"
  echo "  brew install stripe/stripe-cli/stripe"
  echo ""
  echo "Or visit: https://docs.stripe.com/stripe-cli"
  exit 1
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Stripe Webhook Listener${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Get the current webhook secret from Stripe
echo -e "Fetching webhook secret..."
SECRET=$(stripe listen --print-secret 2>/dev/null)

if [ -z "$SECRET" ]; then
  echo -e "${RED}Error: Failed to get webhook secret${NC}"
  echo "Make sure you're logged in: stripe login"
  exit 1
fi

# Function to update .env file if needed
update_env_if_needed() {
  local env_file="$1"
  local secret="$2"
  local file_label="$3"

  if [ ! -f "$env_file" ]; then
    return 0
  fi

  # Get current value from file
  if grep -q "^STRIPE_WEBHOOK_SECRET=" "$env_file"; then
    current_value=$(grep "^STRIPE_WEBHOOK_SECRET=" "$env_file" | cut -d'=' -f2)

    if [ "$current_value" = "$secret" ]; then
      echo -e "  ${file_label}: ${BLUE}up to date${NC}"
      return 0
    fi

    # Update existing value
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${secret}|" "$env_file"
    else
      sed -i "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${secret}|" "$env_file"
    fi
    echo -e "  ${file_label}: ${GREEN}updated${NC}"
  else
    # Add the variable if it doesn't exist
    echo "" >> "$env_file"
    echo "STRIPE_WEBHOOK_SECRET=${secret}" >> "$env_file"
    echo -e "  ${file_label}: ${GREEN}added${NC}"
  fi
}

# Check and update .env files
echo ""
update_env_if_needed "$ROOT_ENV_FILE" "$SECRET" ".env"
[ -f "$SERVER_ENV_FILE" ] && update_env_if_needed "$SERVER_ENV_FILE" "$SECRET" "server/.env"

echo ""
echo -e "Endpoint: ${GREEN}${WEBHOOK_ENDPOINT}${NC}"
echo ""
echo -e "${YELLOW}Listening for webhook events...${NC}"
echo -e "Press ${RED}Ctrl+C${NC} to stop"
echo ""

# Start the listener
stripe listen --forward-to "$WEBHOOK_ENDPOINT"
