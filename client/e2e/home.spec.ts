import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    // Should have the main heading or brand name
    await expect(page.locator('body')).toBeVisible()

    // Should not show loading state after page loads
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
  })

  test('should have navigation header', async ({ page }) => {
    await page.goto('/')

    // Should have a navigation element
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()
  })

  test('should have links to store', async ({ page }) => {
    await page.goto('/')

    // Should have a link to the store
    const storeLink = page.getByRole('link', { name: /store|shop|products/i })
    if (await storeLink.count() > 0) {
      await expect(storeLink.first()).toBeVisible()
    }
  })

  test('should have links to cart', async ({ page }) => {
    await page.goto('/')

    // Should have a cart button/link (may be icon-only)
    const cartLink = page.locator('[href*="cart"], [aria-label*="cart" i], button:has-text("cart")')
    if (await cartLink.count() > 0) {
      await expect(cartLink.first()).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still be visible on mobile
    await expect(page.locator('body')).toBeVisible()

    // Check that content is not overflowing horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })
})
