import { test as base, expect, Page } from '@playwright/test'

/**
 * Custom test fixtures for E2E tests.
 * Provides common helpers and setup for test scenarios.
 */

// Test user credentials (use test environment)
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
}

export const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
}

/**
 * Helper to wait for page to be fully loaded.
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
}

/**
 * Helper to login a user.
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"], input[name="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for redirect or error
  await page.waitForTimeout(2000)
}

/**
 * Helper to check if user is logged in.
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for user menu or logout button
  const userIndicator = page.locator('[data-testid="user-menu"], button:has-text("logout"), button:has-text("sign out")')
  return (await userIndicator.count()) > 0
}

/**
 * Helper to add a product to cart.
 */
export async function addProductToCart(page: Page) {
  await page.goto('/store')
  await waitForPageLoad(page)

  // Click first product
  const productLink = page.locator('a[href*="/product/"]').first()
  if (await productLink.count() > 0) {
    await productLink.click()
    await waitForPageLoad(page)

    // Click add to cart
    const addButton = page.locator('button:has-text("add to cart"), button:has-text("add to bag")').first()
    if (await addButton.count() > 0) {
      await addButton.click()
      await page.waitForTimeout(1000)
      return true
    }
  }
  return false
}

/**
 * Helper to clear cart.
 */
export async function clearCart(page: Page) {
  await page.goto('/cart')
  await waitForPageLoad(page)

  // Remove all items if any exist
  const removeButtons = page.locator('button:has-text("remove"), button[aria-label*="remove"]')
  const count = await removeButtons.count()

  for (let i = 0; i < count; i++) {
    await removeButtons.first().click()
    await page.waitForTimeout(500)
  }
}

/**
 * Extended test with common fixtures.
 */
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await loginUser(page, TEST_USER.email, TEST_USER.password)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- 'use' is Playwright's fixture callback, not a React hook
    await use(page)
  },
})

export { expect }
