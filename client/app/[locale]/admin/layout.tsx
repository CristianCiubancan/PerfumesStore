'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { AdminSidebar, AdminMobileSidebar } from './components/admin-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations('admin')
  const tError = useTranslations('error')
  const router = useRouter()
  const { user, isAuthenticated, isHydrating } = useAuthStore()

  useEffect(() => {
    if (isHydrating) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'ADMIN') {
      toast.error(t('accessDenied'))
      router.push('/')
      return
    }
  }, [isAuthenticated, isHydrating, user, router, t])

  // Don't render anything while checking auth
  if (isHydrating || !isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <AdminMobileSidebar />
          <span className="font-semibold">{t('sidebar.title')}</span>
        </header>

        {/* Page Content with Error Boundary */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ErrorBoundary
            fallback={
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-semibold">{tError('title')}</h2>
                <p className="text-muted-foreground">{tError('description')}</p>
              </div>
            }
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
