import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { Breadcrumb } from "@/components/seo"
import { HashtagClient } from "./HashtagClient"
import type { Post, PaginatedResponse } from "@/types/post"

const BASE_URL = "https://chungtoixayweb.vn"

interface HashtagPageProps {
  params: Promise<{ name: string }>
}

interface HashtagInfo {
  id: string
  name: string
  postCount: number
  trendingScore: number
}

interface HashtagWithPosts {
  hashtag: HashtagInfo
  posts: PaginatedResponse<Post>
}

/**
 * Server-side data fetching for hashtag page
 */
async function getHashtagData(name: string): Promise<HashtagWithPosts | null> {
  try {
    const response = await api<{ data: HashtagWithPosts }>(
      `/hashtags/${name}/posts?page=1&limit=10`,
      { next: { revalidate: 60 } } as RequestInit
    )
    return response?.data ?? null
  } catch {
    return null
  }
}

/**
 * Dynamic metadata for hashtag pages - SEO optimized
 */
export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
  const { name } = await params
  const data = await getHashtagData(name)

  if (!data) {
    return {
      title: "Hashtag không tồn tại",
      description: "Hashtag này không tồn tại hoặc chưa có bài viết nào.",
    }
  }

  const { hashtag } = data
  const title = `#${hashtag.name} - ${hashtag.postCount} bài viết`
  const description = `Khám phá ${hashtag.postCount} bài viết với hashtag #${hashtag.name} trên ChungToiXayWeb. Cộng đồng thiết kế web và mạng xã hội Việt Nam.`
  const url = `${BASE_URL}/hashtag/${hashtag.name}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ChungToiXayWeb",
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * JSON-LD structured data for hashtag page
 */
function generateJsonLd(hashtag: HashtagInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `#${hashtag.name}`,
    description: `Bài viết với hashtag #${hashtag.name} trên ChungToiXayWeb`,
    url: `${BASE_URL}/hashtag/${hashtag.name}`,
    isPartOf: {
      "@type": "WebSite",
      name: "ChungToiXayWeb",
      url: BASE_URL,
    },
    about: {
      "@type": "Thing",
      name: hashtag.name,
    },
  }
}

/**
 * Hashtag Page - Server Component with SSR
 * Fetches initial data server-side for SEO crawlability
 */
export default async function HashtagPage({ params }: HashtagPageProps) {
  const { name } = await params
  const data = await getHashtagData(name)

  if (!data) {
    notFound()
  }

  const { hashtag, posts } = data
  const initialPosts = Array.isArray(posts?.data) ? posts.data : []
  const jsonLd = generateJsonLd(hashtag)

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* JSON-LD Structured Data */}
      <script
        key="hashtag-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Xu hướng", href: "/trending" },
          { label: `#${name}` },
        ]}
      />

      {/* Client-side interactive content with SSR initial data */}
      <HashtagClient
        name={name}
        initialHashtag={hashtag}
        initialPosts={initialPosts}
      />
    </div>
  )
}
