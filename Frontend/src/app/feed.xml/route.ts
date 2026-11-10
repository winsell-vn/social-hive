import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/api'
const SITE_URL = 'https://chungtoixayweb.vn'
const SITE_NAME = 'ChungToiXayWeb'
const SITE_DESCRIPTION = 'Nền tảng mạng xã hội kết nối cộng đồng thiết kế web Việt Nam. Chia sẻ kiến thức, đăng bài viết, nhận dự án thiết kế website chuyên nghiệp.'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  category: { name: string; slug: string } | null
  author: { profile?: { displayName?: string; username?: string } | null } | null
  publishedAt: string | null
  createdAt: string
}

interface BlogListResponse {
  data: BlogPost[]
  meta: { total: number }
}

// Backend API response is wrapped by TransformInterceptor: { success, data: {...}, timestamp }
interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/blog/posts?limit=25&status=PUBLISHED`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    } as RequestInit)

    if (!response.ok) {
      return new NextResponse(getDefaultRssFeed(), {
        status: 200,
        headers: getRssHeaders(),
      })
    }

    // Backend wraps response in { success, data: { data: [...], meta: {...} }, timestamp }
    const result: ApiResponse<BlogListResponse> = await response.json()
    const posts = result.data?.data || []
    const rssXml = generateRssFeed(posts)

    return new NextResponse(rssXml, {
      status: 200,
      headers: getRssHeaders(),
    })
  } catch (error) {
    console.error('Failed to generate RSS feed:', error)
    return new NextResponse(getDefaultRssFeed(), {
      status: 200,
      headers: getRssHeaders(),
    })
  }
}

function getRssHeaders() {
  return {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function generateRssFeed(posts: BlogPost[]): string {
  const now = new Date().toUTCString()
  
  const items = posts.map((post) => {
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.createdAt).toUTCString()
    const link = `${SITE_URL}/blog/${post.category?.slug || 'uncategorized'}/${post.slug}`
    const authorName = post.author?.profile?.displayName || post.author?.profile?.username || 'ChungToiXayWeb'
    const category = post.category?.name || 'Blog'
    const description = post.excerpt || stripHtml(post.content).substring(0, 300) + '...'
    const imageTag = post.featuredImage 
      ? `<enclosure url="${escapeXml(post.featuredImage)}" type="image/jpeg" length="0" />`
      : ''

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(authorName)}</author>
      <category>${escapeXml(category)}</category>
      <description><![CDATA[${description.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></description>
      <content:encoded><![CDATA[${post.content.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
      ${imageTag}
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} - Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>vi</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/android-chrome-512x512.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`
}

function getDefaultRssFeed(): string {
  const now = new Date().toUTCString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} - Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>vi</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  </channel>
</rss>`
}

