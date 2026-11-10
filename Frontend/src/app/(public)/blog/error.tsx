'use client'

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Không thể tải bài viết</h2>
      <p className="text-muted-foreground mb-6">
        Đã xảy ra lỗi khi tải nội dung. Vui lòng thử lại.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Thử lại
      </button>
    </div>
  )
}

