'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function BestSellersSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-32 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BrandStorySkeleton() {
  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-40 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function SpecialOfferSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </section>
  )
}

export function FragranceFinderSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Skeleton className="h-8 w-40 mx-auto mb-6 rounded-full" />
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-48 mx-auto" />
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        <div className="max-w-3xl mx-auto text-center px-8 py-6">
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-5 h-5 rounded" />
            ))}
          </div>
          <Skeleton className="h-24 w-full mb-6" />
          <div className="flex items-center justify-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="text-left space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function BrandsShowcaseSkeleton() {
  return (
    <section className="py-16 md:py-20 border-t">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="flex gap-16 items-center justify-center overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32 shrink-0" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function NewsletterSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-6 bg-primary-foreground/10" />
          <Skeleton className="h-10 w-64 mx-auto mb-4 bg-primary-foreground/10" />
          <Skeleton className="h-5 w-96 mx-auto mb-8 bg-primary-foreground/10" />
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Skeleton className="h-10 flex-1 bg-primary-foreground/10" />
            <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
          </div>
        </div>
      </div>
    </section>
  )
}
