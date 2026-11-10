'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let rafId: number

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
        setProgress(Math.min(scrollPercent, 100))
        setVisible(scrollTop > 100)
      })
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-muted">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến trình đọc bài viết"
      />
    </div>
  )
}

