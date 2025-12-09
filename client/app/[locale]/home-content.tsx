'use client'

import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/lib/api/products'
import {
  HeroSection,
  FeaturedProducts,
  ShopByCategory,
  TrustSignals,
} from '@/components/home'
import {
  BestSellersSkeleton,
  BrandStorySkeleton,
  SpecialOfferSkeleton,
  FragranceFinderSkeleton,
  TestimonialsSkeleton,
  BrandsShowcaseSkeleton,
  NewsletterSkeleton,
} from '@/components/home/loading-skeletons'

// Lazy load below-fold components for better initial page performance
const BestSellers = dynamic(
  () => import('@/components/home/best-sellers').then((mod) => mod.BestSellers),
  { loading: () => <BestSellersSkeleton />, ssr: true }
)

const BrandStory = dynamic(
  () => import('@/components/home/brand-story').then((mod) => mod.BrandStory),
  { loading: () => <BrandStorySkeleton />, ssr: true }
)

const SpecialOffer = dynamic(
  () => import('@/components/home/special-offer').then((mod) => mod.SpecialOffer),
  { loading: () => <SpecialOfferSkeleton />, ssr: true }
)

const FragranceFinder = dynamic(
  () => import('@/components/home/fragrance-finder').then((mod) => mod.FragranceFinder),
  { loading: () => <FragranceFinderSkeleton />, ssr: true }
)

const Testimonials = dynamic(
  () => import('@/components/home/testimonials').then((mod) => mod.Testimonials),
  { loading: () => <TestimonialsSkeleton />, ssr: true }
)

const BrandsShowcase = dynamic(
  () => import('@/components/home/brands-showcase').then((mod) => mod.BrandsShowcase),
  { loading: () => <BrandsShowcaseSkeleton />, ssr: true }
)

const Newsletter = dynamic(
  () => import('@/components/home/newsletter').then((mod) => mod.Newsletter),
  { loading: () => <NewsletterSkeleton />, ssr: false }
)

export function HomePage() {
  // Fetch newest products for Featured section
  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () =>
      productsApi.list({
        limit: 8,
        sortBy: 'newest',
        sortOrder: 'desc',
      }),
  })

  // Fetch best-rated products for Best Sellers section
  const { data: bestSellersData } = useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () =>
      productsApi.list({
        limit: 4,
        sortBy: 'rating',
        sortOrder: 'desc',
      }),
  })

  // Fetch unique brands from in-stock products
  const { data: brandsData } = useQuery({
    queryKey: ['products', 'brands'],
    queryFn: () => productsApi.getBrands(),
  })

  // Fetch store stats for hero section
  const { data: statsData } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.getStats(),
  })

  const featuredProducts = featuredData?.products || []
  const bestSellers = bestSellersData?.products || []
  const brands = brandsData || []
  const stats = statsData || { productCount: 0, brandCount: 0 }

  return (
    <div className="flex-1">
      {/* Hero Section - Above the fold */}
      <HeroSection stats={stats} />

      {/* Trust Signals - Build immediate credibility */}
      <TrustSignals />

      {/* Featured/New Arrivals */}
      <FeaturedProducts products={featuredProducts} />

      {/* Shop by Category */}
      <ShopByCategory />

      {/* Best Sellers */}
      <BestSellers products={bestSellers} />

      {/* Brand Story */}
      <BrandStory />

      {/* Special Offer Banner */}
      <SpecialOffer />

      {/* Fragrance Finder */}
      <FragranceFinder />

      {/* Customer Testimonials */}
      <Testimonials />

      {/* Brands Showcase */}
      <BrandsShowcase brands={brands} />

      {/* Newsletter Signup */}
      <Newsletter />
    </div>
  )
}
