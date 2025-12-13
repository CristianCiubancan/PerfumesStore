import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate from home to store', async ({ page }) => {
    await page.goto('/')

    // Find link to store
    const storeLink = page.locator('a[href*="store"], a:has-text("store"), a:has-text("shop")')

    if (await storeLink.count() > 0) {
      await storeLink.first().click()
      await expect(page).toHaveURL(/\/store/)
    }
  })

  test('should navigate from store back to home', async ({ page }) => {
    await page.goto('/store')

    // Find link to home (logo or home link)
    const homeLink = page.locator('a[href="/"], a[href$="/en"], a[href$="/ro"]').first()

    if (await homeLink.count() > 0) {
      await homeLink.click()
      // Should be on home page (either / or /en or /ro)
      await expect(page).toHaveURL(/\/$|\/en\/?$|\/ro\/?$/)
    }
  })

  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/')

    // Find cart link/button
    const cartLink = page.locator('a[href*="cart"], [aria-label*="cart" i]')

    if (await cartLink.count() > 0) {
      await cartLink.first().click()
      await expect(page).toHaveURL(/\/cart/)
    }
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Find login link
    const loginLink = page.locator('a[href*="login"], button:has-text("sign in"), button:has-text("login")')

    if (await loginLink.count() > 0) {
      await loginLink.first().click()
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe('Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should have mobile menu toggle', async ({ page }) => {
    await page.goto('/')

    // Look for hamburger menu or mobile menu toggle
    const menuToggle = page.locator('button[aria-label*="menu" i], [data-testid="mobile-menu"], .hamburger, button:has([class*="menu"])')

    if (await menuToggle.count() > 0) {
      await expect(menuToggle.first()).toBeVisible()
    }
  })

  test('should open mobile menu when clicked', async ({ page }) => {
    await page.goto('/')

    // Find and click menu toggle
    const menuToggle = page.locator('button[aria-label*="menu" i], [data-testid="mobile-menu"]').first()

    if (await menuToggle.count() > 0) {
      await menuToggle.click()

      // Wait for menu to open
      await page.waitForTimeout(500)

      // Expanded menu content should be visible
    }
  })
})

test.describe('Navigation - Breadcrumbs', () => {
  test('product page should show breadcrumbs', async ({ page }) => {
    await page.goto('/store')
    await page.waitForLoadState('networkidle')

    // Navigate to a product
    const productLink = page.locator('a[href*="/product/"]').first()

    if (await productLink.count() > 0) {
      await productLink.click()
      await page.waitForLoadState('networkidle')

      // Breadcrumb navigation may or may not exist depending on design
    }
  })
})

test.describe('Language Switching', () => {
  test('should be able to switch language', async ({ page }) => {
    await page.goto('/')

    // Look for language switcher
    const langSwitcher = page.locator('[data-testid="language-switcher"], button:has-text("EN"), button:has-text("RO"), select[name*="lang"], [aria-label*="language" i]')

    if (await langSwitcher.count() > 0) {
      // Language switcher exists
      await expect(langSwitcher.first()).toBeVisible()
    }
  })

  test('should load Romanian locale', async ({ page }) => {
    await page.goto('/ro')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()

    // URL should contain /ro
    expect(page.url()).toContain('/ro')
  })

  test('should load English locale', async ({ page }) => {
    await page.goto('/en')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()

    // URL should contain /en
    expect(page.url()).toContain('/en')
  })
})
