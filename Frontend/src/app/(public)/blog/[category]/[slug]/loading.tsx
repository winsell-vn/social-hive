export default function BlogDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </div>
      {/* Title skeleton */}
      <div className="h-10 w-3/4 bg-muted animate-pulse rounded mb-4" />
      {/* Meta skeleton */}
      <div className="flex gap-4 mb-8">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
      {/* Featured image skeleton */}
      <div className="h-64 w-full bg-muted animate-pulse rounded-lg mb-8" />
      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

