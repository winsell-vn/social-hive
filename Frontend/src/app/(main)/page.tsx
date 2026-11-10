import type { Metadata } from "next"
import { api } from "@/lib/api"
import { NewsfeedClient } from "./NewsfeedClient"
import { OrganizationSchema, WebSiteSchema } from "@/components/seo"
import type { Post, PaginatedResponse } from "@/types/post"

const BASE_URL = "https://chungtoixayweb.vn"

/**
 * Props for HomePage - Next.js 16 App Router uses Promise for searchParams
 */
interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

/**
 * Dynamic metadata generation for SEO pagination support
 * - Page 1: Full metadata with indexing
 * - Page 2+: Modified title, noindex to avoid duplicate content
 */
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  const baseTitle = "ChungToiXayWeb - Nền tảng Mạng xã hội & Thiết kế Website"
  const title = page > 1 ? `${baseTitle} - Trang ${page}` : baseTitle

  const baseDescription = "Nền tảng mạng xã hội kết nối cộng đồng thiết kế web Việt Nam. Chia sẻ kiến thức, đăng bài viết, nhận dự án thiết kế website chuyên nghiệp."

  const metadata: Metadata = {
    title,
    description: page > 1
      ? `${baseDescription} Tham gia cộng đồng sáng tạo ngay! - Trang ${page}`
      : `${baseDescription} Tham gia cộng đồng sáng tạo ngay!`,
    keywords: [
      "thiết kế website",
      "mạng xã hội",
      "web design",
      "cộng đồng",
      "Việt Nam",
      "dự án web",
      "thiết kế web chuyên nghiệp",
      "cộng đồng thiết kế",
    ],
    openGraph: {
      title,
      description: baseDescription,
      url: page > 1 ? `${BASE_URL}?page=${page}` : BASE_URL,
      siteName: "ChungToiXayWeb",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/android-chrome-512x512.png`,
          width: 1200,
          height: 630,
          alt: "ChungToiXayWeb - Nền tảng Mạng xã hội & Thiết kế Website",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: baseDescription,
      images: [`${BASE_URL}/android-chrome-512x512.png`],
    },
    alternates: {
      canonical: page > 1 ? `${BASE_URL}?page=${page}` : BASE_URL,
    },
  }

  // Page 2+ should not be indexed (duplicate content risk) - AC-005
  if (page > 1) {
    metadata.robots = { index: false, follow: true }
  }

  return metadata
}

/**
 * Server-side data fetching for initial posts (SSR)
 * Uses ISR with 60-second revalidation for optimal performance
 * @param page - Page number to fetch (default: 1)
 */
async function getInitialPosts(page: number = 1): Promise<Post[]> {
  try {
    const response = await api<{ data: PaginatedResponse<Post> }>(
      `/posts?page=${page}&limit=20`,
      {
        next: { revalidate: 60 }, // ISR: Cache for 60 seconds
      } as RequestInit
    )

    // Handle response structure defensively (learned pattern)
    const data = response?.data?.data
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Failed to fetch initial posts for SSR:", error)
    return []
  }
}

/**
 * Homepage - Server Component with SSR
 * Fetches initial posts server-side for SEO crawlability
 * Renders structured data (Organization + WebSite schemas)
 * Supports ?page=N URL parameter for SEO pagination
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  const initialPosts = await getInitialPosts(page)

  // Determine pagination state for rel="next/prev" link tags (AC-015)
  // hasNextPage: true if we got a full page of results (20 posts)
  const hasNextPage = initialPosts.length >= 20
  const hasPrevPage = page > 1

  return (
    <>
      {/* SEO Pagination link tags - hoisted to <head> by Next.js App Router */}
      {hasPrevPage && (
        <link
          key="home-pagination-prev"
          rel="prev"
          href={page === 2 ? BASE_URL : `${BASE_URL}?page=${page - 1}`}
        />
      )}
      {hasNextPage && (
        <link key="home-pagination-next" rel="next" href={`${BASE_URL}?page=${page + 1}`} />
      )}

      {/* Structured Data for SEO - JSON-LD schemas (only on page 1) */}
      {page <= 1 && (
        <>
          <OrganizationSchema />
          <WebSiteSchema />
        </>
      )}

      {/* SEO-friendly H1 heading - visually hidden but accessible to crawlers */}
      <h1 className="sr-only">
        ChungToiXayWeb - Nền tảng Mạng xã hội và Thiết kế Website Việt Nam
      </h1>

      {/* Client-side interactive newsfeed with SSR initial data */}
      <NewsfeedClient initialPosts={initialPosts} currentPage={page} />
    </>
  )
}
