'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas/auth'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Link, useRouter } from '@/i18n/routing'

export function ResetPasswordClient() {
  const t = useTranslations('auth.resetPassword')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Redirect if no token provided
  useEffect(() => {
    if (!token) {
      router.push('/forgot-password')
    }
  }, [token, router])

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) return

    setIsLoading(true)
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword })
      setIsSuccess(true)
      toast.success(t('success'))
    } catch (err: unknown) {
      // Clear password fields on error for security
      form.setValue('newPassword', '')
      form.setValue('confirmPassword', '')
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error(t('unexpectedError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything while redirecting
  if (!token) {
    return null
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('successTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('successDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button>{t('signInButton')}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('newPasswordPlaceholder')}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('confirmPasswordPlaceholder')}
                        autoComplete="new-password"
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
      </Card>
    </div>
  )
}
