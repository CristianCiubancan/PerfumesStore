import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'lib/**/*.{ts,tsx}',
        'store/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/**',
        '**/*.test.{ts,tsx}',
        '**/index.ts',
        // shadcn/ui components are third-party
        'components/ui/**',
        // Thin wrappers
        'components/theme-provider.tsx',
        'components/theme-toggle.tsx',
        // i18n/seo - complex server/client boundaries
        'components/seo/**',
        'lib/seo.ts',
        // Environment and error reporting - need special mocking
        'lib/env.ts',
        'lib/errorReporting.ts',
        // API client - would need MSW for proper testing
        'lib/api/**',
        // Complex page content components that mainly compose other components
        'components/home/**',
        'components/layout/**',
        'components/cart/cart-page-content.tsx',
        'components/cart/cart-summary.tsx',
        'components/cart/cart-item-row.tsx',
        // Switchers that depend on complex i18n routing
        'components/currency-switcher.tsx',
        'components/language-switcher.tsx',
        // Store filters - very complex component with many dependencies
        'components/store/product-filters.tsx',
        'components/store/product-card.tsx',
        'components/store/add-to-cart-button.tsx',
        // Hook that depends on API
        'hooks/use-filter-options.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
