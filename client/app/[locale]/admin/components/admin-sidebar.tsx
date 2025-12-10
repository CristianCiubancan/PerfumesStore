'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Package,
  Tag,
  Settings,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Menu,
  FileText,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Link } from '@/i18n/routing'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api/auth'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  disabled?: boolean
  comingSoon?: boolean
}

const navItems: NavItem[] = [
  { href: '/admin/products', label: 'products', icon: Package },
  { href: '/admin/orders', label: 'orders', icon: ShoppingCart },
  { href: '/admin/promotions', label: 'promotions', icon: Tag },
  { href: '/admin/newsletter', label: 'newsletter', icon: Mail },
  { href: '/admin/audit-logs', label: 'auditLogs', icon: FileText },
  { href: '/admin/settings', label: 'settings', icon: Settings },
]

const futureItems: NavItem[] = [
  { href: '/admin/customers', label: 'customers', icon: Users, disabled: true, comingSoon: true },
  { href: '/admin/analytics', label: 'analytics', icon: BarChart3, disabled: true, comingSoon: true },
]

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const t = useTranslations('admin.sidebar')
  const Icon = item.icon

  if (item.disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.label)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{t('comingSoon')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{t(item.label)}</span>
    </Link>
  )
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const t = useTranslations('admin.sidebar')
  const pathname = usePathname()
  const { clearAuth } = useAuthStore()

  // Check if path matches (handle locale prefix)
  const isActive = (href: string) => {
    // Remove locale prefix from pathname for comparison
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + '/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="flex items-center gap-2 px-4 py-6 border-b">
        <Package className="h-6 w-6" />
        <span className="font-semibold text-lg">{t('title')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            onClick={onItemClick}
          />
        ))}

        {/* Separator */}
        <div className="my-4 border-t" />

        {/* Future items (disabled) */}
        {futureItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={false}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={async () => {
            try {
              await authApi.logout()
            } finally {
              clearAuth()
              onItemClick?.()
            }
          }}
        >
          <LogOut className="h-5 w-5" />
          <span>{t('logout')}</span>
        </Button>
      </div>
    </div>
  )
}

// Desktop Sidebar
export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-background">
      <SidebarContent />
    </aside>
  )
}

// Mobile Sidebar (Sheet/Drawer)
export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false)
  const t = useTranslations('admin.sidebar')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <SidebarContent onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
