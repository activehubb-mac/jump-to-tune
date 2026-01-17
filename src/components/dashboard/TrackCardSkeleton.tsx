import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <div className="glass-card p-4">
      {/* Album Art Skeleton */}
      <Skeleton className="aspect-square rounded-lg mb-4" />
      
      {/* Track Info Skeleton */}
      <div className="space-y-2">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Artist */}
        <Skeleton className="h-4 w-1/2" />
        {/* Mood tags */}
        <div className="flex gap-1 mt-1.5">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        {/* Price and editions */}
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TrackCardSkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  );
}
