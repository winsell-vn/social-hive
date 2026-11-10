'use client';

/**
 * Breadcrumb - Visual navigation + BreadcrumbList JSON-LD schema for SEO
 * Client Component - uses lucide-react icons which require client-side rendering
 */

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const BASE_URL = "https://chungtoixayweb.vn"

export interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string
  /** URL path (optional - if not provided, renders as current page) */
  href?: string
  /** Whether to truncate long labels */
  truncate?: boolean
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[]
  /** Additional CSS classes */
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Generate JSON-LD BreadcrumbList schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        key="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className={cn("py-3", className)}>
        <ol className="flex items-center flex-wrap gap-1 text-xs sm:text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight
                    className="h-4 w-4 mx-2 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                {isLast || !item.href ? (
                  <span
                    className={cn(
                      "text-foreground font-medium",
                      item.truncate &&
                        "max-w-[150px] sm:max-w-[250px] md:max-w-[400px] truncate inline-block align-bottom"
                    )}
                    aria-current="page"
                    title={item.truncate ? item.label : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                      item.truncate &&
                        "max-w-[120px] sm:max-w-[200px] md:max-w-none truncate inline-block align-bottom"
                    )}
                    title={item.truncate ? item.label : undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

export default Breadcrumb

