'use client'

/**
 * TableOfContents - Client component for article navigation
 * Features: smooth scroll, sticky positioning, active section highlighting
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TocItem {
  id: string
  text: string
  level: number
}

export interface TableOfContentsProps {
  /** Array of heading items */
  items: TocItem[]
  /** Additional CSS classes */
  className?: string
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    // Observe all heading elements
    items.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setActiveId(id)
    }
  }

  if (!items || items.length === 0) {
    return null
  }

  // Find minimum level to normalize indentation
  const minLevel = Math.min(...items.map((item) => item.level))

  return (
    <nav
      className={cn('sticky top-24', className)}
      aria-label="Mục lục bài viết"
    >
      <h2 className="text-sm font-semibold text-foreground mb-3">Mục lục</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => {
          const indent = item.level - minLevel
          const isActive = activeId === item.id

          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${indent * 12}px` }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  'block py-1 border-l-2 pl-3 transition-colors duration-200',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default TableOfContents

