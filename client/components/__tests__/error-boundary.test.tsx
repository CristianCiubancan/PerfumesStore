import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

// Component that throws an error
function BrokenComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Working component</div>
}

describe('ErrorBoundary', () => {
  // Suppress console errors for cleaner test output
  const originalConsoleError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders default fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('renders custom title when provided', () => {
    render(
      <ErrorBoundary fallbackTitle="Custom Title">
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(
      <ErrorBoundary fallbackMessage="Custom error message">
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('renders custom button text when provided', () => {
    render(
      <ErrorBoundary fallbackButtonText="Retry">
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('resets error state when try again is clicked', () => {
    // Create a component that can toggle error state
    let shouldThrow = true
    function ToggleableComponent() {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Recovered content</div>
    }

    render(
      <ErrorBoundary>
        <ToggleableComponent />
      </ErrorBoundary>
    )

    // Should show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Fix the error
    shouldThrow = false

    // Click try again
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    // Should now show content
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
  })

  it('displays warning icon', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByLabelText('warning')).toBeInTheDocument()
  })

  it('logs error in development mode', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()
  })
})
