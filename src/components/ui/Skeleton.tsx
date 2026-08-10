// Skeleton component — reusable animated loading placeholder
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-100 ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-40 flex-1" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="p-5 space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Skeleton className="h-4 w-36" />
        </div>
        {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
