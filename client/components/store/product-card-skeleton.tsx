import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full rounded-none" />

      <CardContent className="p-4">
        {/* Brand and name with rating */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>

        {/* Badges */}
        <div className="mb-3 flex gap-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Price and volume */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Add to cart button */}
        <Skeleton className="mt-3 h-9 w-full" />
      </CardContent>
    </Card>
  )
}
