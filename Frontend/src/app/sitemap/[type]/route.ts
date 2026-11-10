import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/api'

// Regex patterns for allowed sitemap types (security)
// Supports: posts-1, users-2, hashtags-3, blog-1, images-2, static
const PAGINATED_PATTERN = /^(posts|users|hashtags|blog|images)-(\d+)$/
const STATIC_TYPES = ['static']

function isValidSitemapType(type: string): boolean {
  // Check if it's a static type
  if (STATIC_TYPES.includes(type)) {
    return true
  }
  // Check if it matches paginated pattern (e.g., posts-1, users-2)
  return PAGINATED_PATTERN.test(type)
}

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params

  // Validate type to prevent arbitrary proxy (security)
  const sitemapType = type.replace('.xml', '')

  if (!isValidSitemapType(sitemapType)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const response = await fetch(`${BACKEND_URL}/sitemap/${type}`, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/xml' },
    } as RequestInit)

    if (!response.ok) {
      return new NextResponse('Sitemap not found', { status: 404 })
    }

    const xml = await response.text()

    // Validate response is actual XML
    const trimmed = xml.trim()
    if (!trimmed.startsWith('<')) {
      console.error(`Backend returned non-XML for sitemap/${type}:`, trimmed.substring(0, 200))
      return new NextResponse('Sitemap unavailable', { status: 503 })
    }

    return new NextResponse(trimmed, { status: 200, headers: XML_HEADERS })
  } catch (error) {
    console.error(`Failed to fetch sitemap/${type}:`, error)
    return new NextResponse('Sitemap unavailable', { status: 503 })
  }
}

