'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { loginSchema, LoginFormData } from '@/lib/schemas/auth'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import { ApiError } from '@/lib/api/client'
import { Link, useRouter } from '@/i18n/routing'
import { locales } from '@/i18n/config'

export function LoginClient() {
  const t = useTranslations('auth.login')
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      setAuth(response.user)
      toast.success(t('success'))

      // Read returnTo from URL and redirect
      const params = new URLSearchParams(window.location.search)
      const returnTo = params.get('returnTo')

      // Only allow relative URLs to prevent open redirect attacks
      let redirectTo = returnTo?.startsWith('/') ? returnTo : '/'

      // Strip locale prefix if present (next-intl router adds it automatically)
      const localePattern = new RegExp(`^/(${locales.join('|')})(/.*)?$`)
      const match = redirectTo.match(localePattern)
      if (match) {
        redirectTo = match[2] || '/'
      }

      router.push(redirectTo)
    } catch (error) {
      // Clear password field on error for security
      form.setValue('password', '')
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('unexpectedError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              {t('signUpLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
