'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { TIMING } from '@/lib/constants'
import { newsletterApi } from '@/lib/api/newsletter'
import { ApiError } from '@/lib/api/client'

export function Newsletter() {
  const t = useTranslations('home')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    try {
      await newsletterApi.subscribe({ email })
      setStatus('success')
      toast.success(t('newsletter.success'))
      setEmail('')

      // Reset after showing success
      setTimeout(() => setStatus('idle'), TIMING.NEWSLETTER_RESET_MS)
    } catch (error) {
      setStatus('idle')
      if (error instanceof ApiError && error.code === 'RATE_LIMIT_EXCEEDED') {
        toast.error(t('newsletter.rateLimited'))
      } else {
        toast.error(t('newsletter.error'))
      }
    }
  }

  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t('newsletter.title')}
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            {t('newsletter.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={t('newsletter.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30"
              required
            />
            <Button
              type="submit"
              variant="secondary"
              className="shrink-0"
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {status === 'success' && <Check className="w-4 h-4 mr-2" />}
              {status === 'idle' && <ArrowRight className="w-4 h-4 mr-2" />}
              {status === 'success'
                ? t('newsletter.subscribed')
                : t('newsletter.cta')}
            </Button>
          </form>

          <p className="text-xs text-primary-foreground/60 mt-4">
            {t('newsletter.privacy')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
