'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { checkoutApi } from '@/lib/api/checkout'
import { promotionsApi } from '@/lib/api/promotions'
import { useFormattedPrice } from '@/lib/currency'
import type { Promotion } from '@/types'
import { Link } from '@/i18n/routing'

// ISO 3166-1 alpha-2 country codes for common EU countries
const COUNTRIES = [
  { code: 'RO', name: 'Romania' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'HU', name: 'Hungary' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
]

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

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutPageContent() {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const router = useRouter()
  const formatPrice = useFormattedPrice()

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
  const discountAmount = promotion?.discountPercent
    ? totalPrice * (promotion.discountPercent / 100)
    : 0
  const finalPrice = totalPrice - discountAmount

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
                <Card>
                  <CardHeader>
                    <CardTitle>{t('shipping.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipping.name')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('shipping.namePlaceholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email (guests only) */}
                    {!isAuthenticated && (
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipping.email')} *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t('shipping.emailPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipping.phone')}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder={t('shipping.phonePlaceholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Address Line 1 */}
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipping.addressLine1')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('shipping.addressLine1Placeholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address Line 2 */}
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('shipping.addressLine2')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('shipping.addressLine2Placeholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* City */}
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipping.city')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('shipping.cityPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* State/Region */}
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipping.state')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('shipping.statePlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Postal Code */}
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipping.postalCode')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('shipping.postalCodePlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('shipping.country')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t('shipping.countryPlaceholder')}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem
                                    key={country.code}
                                    value={country.code}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <div className="lg:sticky lg:top-20">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('summary.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Items */}
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.productId}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {item.brand} - {item.name} x{item.quantity}
                            </span>
                            <span>
                              {formatPrice(
                                (
                                  parseFloat(item.priceRON) * item.quantity
                                ).toFixed(2)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Subtotal */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('summary.subtotal')}
                        </span>
                        <span>{formatPrice(totalPrice.toFixed(2))}</span>
                      </div>

                      {/* Discount */}
                      {promotion && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>
                            {t('summary.discount', {
                              percent: promotion.discountPercent,
                            })}
                          </span>
                          <span>-{formatPrice(discountAmount.toFixed(2))}</span>
                        </div>
                      )}

                      <Separator />

                      {/* Total */}
                      <div className="flex justify-between">
                        <span className="font-medium">{t('summary.total')}</span>
                        <span className="font-bold text-lg">
                          {formatPrice(finalPrice.toFixed(2))}
                        </span>
                      </div>

                      {/* Payment Note */}
                      <p className="text-xs text-muted-foreground text-center">
                        {t('summary.paymentNote')}
                      </p>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('processing')}
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('proceedToPayment')}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
