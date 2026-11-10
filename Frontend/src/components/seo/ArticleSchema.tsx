/**
 * ArticleSchema - JSON-LD Article structured data for SEO
 * Server Component - renders Article schema for rich results in search
 */

const BASE_URL = 'https://chungtoixayweb.vn'

export interface ArticleSchemaProps {
  /** Article title/headline */
  title: string
  /** Article description/excerpt */
  description: string
  /** Featured image URL */
  image?: string | null
  /** ISO date string when article was published */
  datePublished: string
  /** ISO date string when article was last modified */
  dateModified: string
  /** Author's display name */
  authorName: string
  /** Author's profile URL */
  authorUrl?: string
  /** Author's avatar image URL */
  authorImage?: string | null
  /** Author's bio/description (E-E-A-T signal) */
  authorBio?: string | null
  /** Author's job title (E-E-A-T signal) */
  authorJobTitle?: string | null
  /** Author's company/organization (E-E-A-T signal) */
  authorCompany?: string | null
  /** Author's expertise areas (E-E-A-T signal) */
  authorExpertise?: string[] | null
  /** Author's social media links for sameAs (E-E-A-T signal) */
  authorSocialLinks?: string | null
  /** Word count of the article */
  wordCount?: number
  /** Article category name */
  category?: string
  /** Canonical URL of the article */
  url: string
}

function parseSocialLinks(socialLinksJson: string | null | undefined): string[] {
  if (!socialLinksJson) return []
  try {
    const links = JSON.parse(socialLinksJson)
    // Extract URLs from social links object
    return Object.values(links).filter((url): url is string => typeof url === 'string' && url.length > 0)
  } catch {
    return []
  }
}

export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  authorImage,
  authorBio,
  authorJobTitle,
  authorCompany,
  authorExpertise,
  authorSocialLinks,
  wordCount,
  category,
  url,
}: ArticleSchemaProps) {
  // Build author Person schema with E-E-A-T signals
  const authorSchema: Record<string, unknown> = {
    '@type': 'Person',
    name: authorName,
  }

  if (authorUrl) {
    authorSchema.url = authorUrl
  }

  if (authorImage) {
    authorSchema.image = authorImage
  }

  // E-E-A-T: Author bio/description
  if (authorBio) {
    authorSchema.description = authorBio
  }

  // E-E-A-T: Job title
  if (authorJobTitle) {
    authorSchema.jobTitle = authorJobTitle
  }

  // E-E-A-T: Organization
  if (authorCompany) {
    authorSchema.worksFor = {
      '@type': 'Organization',
      name: authorCompany,
    }
  }

  // E-E-A-T: Expertise areas (knowsAbout)
  if (authorExpertise && authorExpertise.length > 0) {
    authorSchema.knowsAbout = authorExpertise
  }

  // E-E-A-T: Social media profiles (sameAs)
  const socialUrls = parseSocialLinks(authorSocialLinks)
  if (socialUrls.length > 0) {
    authorSchema.sameAs = socialUrls
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    ...(image && { image: image }),
    datePublished: datePublished,
    dateModified: dateModified,
    inLanguage: 'vi',
    ...(wordCount && { wordCount: wordCount }),
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'ChungToiXayWeb',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(category && {
      articleSection: category,
    }),
  }

  return (
    <script
      key="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default ArticleSchema

