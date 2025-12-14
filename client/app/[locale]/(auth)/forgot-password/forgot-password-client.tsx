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
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/schemas/auth'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Link } from '@/i18n/routing'

export function ForgotPasswordClient() {
  const t = useTranslations('auth.forgotPassword')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    try {
      await authApi.forgotPassword(data)
      setIsSubmitted(true)
      toast.success(t('success'))
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error(t('unexpectedError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state after submission
  if (isSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('checkEmailTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('checkEmailDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              {t('backToLogin')}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('rememberPassword')}{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              {t('signInLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
