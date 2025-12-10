'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Menu, Home, LogIn, UserPlus, LogOut, User, Settings, ShoppingBag, ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { CurrencySwitcher } from '@/components/currency-switcher'
import { CartBadge } from '@/components/layout/cart-badge'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api/auth'
import { Link, useRouter } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('nav')
  const router = useRouter()
  // FE-003: Use individual selectors to prevent unnecessary re-renders
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      setOpen(false)
      router.push('/')
    }
  }

  const handleNavigation = (path: string) => {
    setOpen(false)
    router.push(path as '/' | '/store' | '/cart' | '/login' | '/register' | '/admin' | '/orders')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Perfumes Store Home">
          <Image
            src="/images/perfume-logo.svg"
            alt="Perfumes Store"
            width={32}
            height={32}
            className="dark:invert"
          />
        </Link>

        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <LanguageSwitcher />
          <ThemeToggle />
          <CartBadge />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>{t('menu')}</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-2 mt-6">
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleNavigation('/')}
                >
                  <Home className="h-5 w-5" />
                  {t('home')}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleNavigation('/store')}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t('store')}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-12"
                  onClick={() => handleNavigation('/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {t('cart')}
                </Button>

                <Separator className="my-2" />

                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavigation('/orders')}
                    >
                      <Package className="h-5 w-5" />
                      {t('myOrders')}
                    </Button>

                    {user?.role === 'ADMIN' && (
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-12"
                        onClick={() => handleNavigation('/admin')}
                      >
                        <Settings className="h-5 w-5" />
                        {t('adminDashboard')}
                      </Button>
                    )}

                    <Separator className="my-2" />

                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      {t('signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavigation('/login')}
                    >
                      <LogIn className="h-5 w-5" />
                      {t('signIn')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavigation('/register')}
                    >
                      <UserPlus className="h-5 w-5" />
                      {t('createAccount')}
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
