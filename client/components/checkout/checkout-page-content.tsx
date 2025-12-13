'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { checkoutApi } from '@/lib/api/checkout'
import { promotionsApi } from '@/lib/api/promotions'
import type { Promotion } from '@/types'
import { Link } from '@/i18n/routing'
import { ShippingForm, CheckoutFormData } from './shipping-form'
import { OrderSummary } from './order-summary'

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(2, 'Postal code is required').max(20),
  country: z.string().length(2, 'Please select a country'),
})

export function CheckoutPageContent() {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const router = useRouter()

  const { items, getTotalPrice } = useCartStore()
  const { user, isAuthenticated, isHydrating } = useAuthStore()

  const [isHydratedCart, setIsHydratedCart] = useState(false)
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'RO',
    },
  })

  // Hydrate cart and fetch promotion
  useEffect(() => {
    queueMicrotask(() => setIsHydratedCart(true))

    const abortController = new AbortController()
    promotionsApi
      .getActive()
      .then((data) => {
        if (!abortController.signal.aborted) {
          setPromotion(data.promotion)
        }
      })
      .catch(() => {
        // Promotion fetch failed - checkout will work without discount
      })

    return () => {
      abortController.abort()
    }
  }, [])

  // Pre-fill name if user is authenticated
  useEffect(() => {
    if (!isHydrating && isAuthenticated && user) {
      form.setValue('name', user.name)
    }
  }, [isHydrating, isAuthenticated, user, form])

  // Redirect to cart if empty
  useEffect(() => {
    if (isHydratedCart && items.length === 0) {
      router.push(`/${locale}/cart`)
    }
  }, [isHydratedCart, items.length, router, locale])

  const handleSubmit = async (data: CheckoutFormData) => {
    // Require email for guests
    if (!isAuthenticated && !data.email) {
      form.setError('email', { message: t('errors.emailRequired') })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await checkoutApi.createSession({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: data.name,
          phone: data.phone || undefined,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || undefined,
          city: data.city,
          state: data.state || undefined,
          postalCode: data.postalCode,
          country: data.country,
        },
        guestEmail: !isAuthenticated ? data.email : undefined,
        locale,
      })

      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.assign(response.url)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.checkoutFailed')
      )
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (!isHydratedCart || isHydrating) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Empty cart - will redirect
  if (items.length === 0) {
    return null
  }

  const totalPrice = getTotalPrice()

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToCart')}
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8 pb-8">
              {/* Shipping Form */}
              <div className="lg:col-span-2 space-y-6">
                <ShippingForm form={form} isAuthenticated={isAuthenticated} />
              </div>

              {/* Order Summary */}
              <div>
                <OrderSummary
                  items={items}
                  totalPrice={totalPrice}
                  promotion={promotion}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
