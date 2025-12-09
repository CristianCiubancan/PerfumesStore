/**
 * Auth Service
 *
 * This file has been refactored into modular components for better maintainability.
 * All exports are re-exported from the auth/ directory for backward compatibility.
 *
 * Structure:
 * - auth/token.service.ts - JWT generation, refresh, revocation
 * - auth/password.service.ts - Password hashing and validation
 * - auth/account.service.ts - Account lockout and user management
 * - auth/index.ts - Unified interface composing all services
 */

export * from './auth/index'
