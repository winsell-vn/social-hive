import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/api'

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/sitemap.xml`, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/xml' },
    } as RequestInit)

    if (!response.ok) {
      return new NextResponse(getDefaultSitemap(), { status: 200, headers: XML_HEADERS })
    }

    const xml = await response.text()

    // Validate response is actual XML (must start with < after trimming whitespace)
    const trimmed = xml.trim()
    if (!trimmed.startsWith('<')) {
      console.error('Backend returned non-XML sitemap response:', trimmed.substring(0, 200))
      return new NextResponse(getDefaultSitemap(), { status: 200, headers: XML_HEADERS })
    }

    return new NextResponse(trimmed, { status: 200, headers: XML_HEADERS })
  } catch (error) {
    console.error('Failed to fetch sitemap:', error)
    return new NextResponse(getDefaultSitemap(), { status: 200, headers: XML_HEADERS })
  }
}

function getDefaultSitemap(): string {
  const baseUrl = 'https://chungtoixayweb.vn'
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/posts-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/users-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/hashtags-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/blog-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/images-1.xml</loc>
  </sitemap>
</sitemapindex>`
}

