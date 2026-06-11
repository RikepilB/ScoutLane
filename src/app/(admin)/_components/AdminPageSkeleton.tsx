import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic route-segment fallback for admin pages: a header row plus a few
 * card-shaped blocks. Shown by Next.js while the server component streams.
 */
export function AdminPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
