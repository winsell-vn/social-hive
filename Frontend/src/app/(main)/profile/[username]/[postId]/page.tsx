import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { PostDetailClient } from "./PostDetailClient"
import { Breadcrumb } from "@/components/seo"
import { RelatedPosts } from "@/features/posts/components/RelatedPosts"
import { RelatedBlogPosts } from "@/components/blog/RelatedContent"
import { generateMetaDescription } from "@/lib/seo/meta-description"
import { calculateReadingTime, formatReadingTime, toISO8601Duration, stripHtmlTags } from "@/lib/seo/reading-time"
import { processUGCLinks } from "@/lib/seo"
import { generatePostImageAlt, generateAvatarAlt } from "@/lib/seo/alt-text"
import { getAvatarUrl, transformImageUrl } from "@/lib/image-url"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Post } from "@/types/post"

// ISR: revalidate every 5 minutes (T-055, AC-039)
export const revalidate = 300

const BASE_URL = "https://chungtoixayweb.vn"
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`

interface PostDetailPageProps {
  params: Promise<{ username: string; postId: string }>
}

// Check if the identifier looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Server-side data fetching for SEO - supports both UUID and slug
async function getPost(username: string, postIdentifier: string): Promise<Post | null> {
  try {
    // If it looks like a UUID, fetch by ID; otherwise fetch by slug
    if (isUUID(postIdentifier)) {
      const response = await api<{ data: Post }>(`/posts/${postIdentifier}`)
      return response.data
    } else {
      const response = await api<{ data: Post }>(`/posts/by-slug/${username}/${postIdentifier}`)
      return response.data
    }
  } catch {
    return null
  }
}

// Helper to truncate text for meta description
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + "..."
}

// Helper to extract first image from post
function getFirstImage(images: string[] | string | null): string | undefined {
  if (!images) return undefined
  if (Array.isArray(images)) return images[0]
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed[0] : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

// Helper to parse images array from post
function parseImages(images: string[] | string | null): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Dynamic metadata for SEO (Open Graph, Twitter Cards) - Enhanced for T-051, T-052
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId, username } = await params
  const post = await getPost(username, postId)

  if (!post) {
    return {
      title: "Bài viết không tồn tại | ChungToiXayWeb",
      description: "Bài viết này không tồn tại hoặc đã bị xóa.",
    }
  }

  const authorName = post.author.profile?.displayName || "Người dùng"
  const authorUsername = post.author.profile?.username || post.author.username || username
  const postTitle = `${authorName} trên ChungToiXayWeb: "${truncateText(stripHtmlTags(post.content), 60)}"`

  // T-051: Use generateMetaDescription for smart description (AC-023)
  const description = generateMetaDescription(post.content, 150)

  // Use slug for URL if available, fallback to id
  const postIdentifier = post.slug || post.id
  const url = `${BASE_URL}/profile/${authorUsername}/${postIdentifier}`

  // T-052: Canonical URL - shared posts point to original (AC-036, AC-037, AC-038)
  let canonicalUrl = url // default self-referencing
  if (post.sharedPostId && post.sharedPost) {
    const originalAuthor = post.sharedPost.author?.profile?.username || post.sharedPost.author?.username
    const originalSlug = post.sharedPost.slug || post.sharedPost.id
    if (originalAuthor) {
      canonicalUrl = `${BASE_URL}/profile/${originalAuthor}/${originalSlug}`
    }
  }

  // og:image priority: post image > author avatar > default site image
  const postImage = getFirstImage(post.images)
  const authorAvatar = post.author.profile?.avatar
  const ogImageUrl = postImage
    ? transformImageUrl(postImage) || postImage
    : authorAvatar
      ? (getAvatarUrl(authorAvatar) ? `${BASE_URL}${getAvatarUrl(authorAvatar)}` : authorAvatar)
      : DEFAULT_OG_IMAGE
  const ogImages = [{ url: ogImageUrl, width: 1200, height: 630, alt: `Bài viết của ${authorName}` }]

  // T-051: Extract keywords from hashtags (AC-020)
  const keywords = post.hashtags?.map((h: any) => h.hashtag?.name || h.name).filter(Boolean) || []

  return {
    title: postTitle,
    description,
    // T-051: Add keywords meta from hashtags (AC-020)
    keywords,
    openGraph: {
      title: postTitle,
      description,
      url: canonicalUrl, // T-052: OG url matches canonical (AC-038)
      siteName: "ChungToiXayWeb",
      type: "article",
      locale: "vi_VN",
      // T-051: Article-specific OG tags (AC-021, AC-022)
      publishedTime: (post.publishAt || post.createdAt)?.toString(),
      modifiedTime: post.updatedAt?.toString(),
      authors: [authorName],
      tags: keywords, // AC-022: article:tag from hashtags
      images: ogImages,
    },
    twitter: {
      // T-051: Smart Twitter card type based on images (AC-024)
      card: post.images && post.images.length > 0 ? "summary_large_image" : "summary",
      title: postTitle,
      description,
      images: ogImages,
    },
    alternates: {
      canonical: canonicalUrl, // T-052: Canonical URL (AC-036, AC-037)
    },
    // Noindex non-published posts (drafts, pending, etc.)
    ...(post.status !== "PUBLISHED" && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  }
}

// JSON-LD structured data for SEO - Enhanced for T-053
function generateJsonLd(post: Post, username: string) {
  const authorName = post.author.profile?.displayName || "Người dùng"
  const authorUsername = post.author.profile?.username || post.author.username || username
  const authorAvatar = post.author.profile?.avatar
  // T-098: Author bio and expertise fields for enhanced Person schema
  const authorBio = post.author.profile?.bio
  const authorJobTitle = post.author.profile?.jobTitle
  const authorCompany = post.author.profile?.company
  const hashtags = post.hashtags?.map((h: any) => h.hashtag?.name || h.name).filter(Boolean) || []
  const imageCount = post.images?.length || 0
  const readingTime = calculateReadingTime(post.content || '', imageCount)

  // Use slug for URL if available, fallback to id
  const postIdentifier = post.slug || post.id
  const url = `${BASE_URL}/profile/${authorUsername}/${postIdentifier}`

  // T-052: Canonical URL for shared posts (AC-036, AC-037)
  let canonicalUrl = url
  if (post.sharedPostId && post.sharedPost) {
    const originalAuthor = post.sharedPost.author?.profile?.username || post.sharedPost.author?.username
    const originalSlug = post.sharedPost.slug || post.sharedPost.id
    if (originalAuthor) {
      canonicalUrl = `${BASE_URL}/profile/${originalAuthor}/${originalSlug}`
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: truncateText(stripHtmlTags(post.content || ''), 110),
    articleBody: post.content,
    datePublished: (post.publishAt || post.createdAt)?.toString(),
    dateModified: post.updatedAt?.toString(),
    // T-053: New fields (AC-025, AC-026, AC-027, AC-028, AC-029, AC-034)
    inLanguage: "vi",
    isAccessibleForFree: true,
    wordCount: readingTime.wordCount,
    commentCount: post._count?.comments ?? post.commentCount ?? 0,
    keywords: hashtags,
    timeRequired: toISO8601Duration(readingTime.minutes),
    // T-053 & T-098: Enhanced author with image, bio, jobTitle, worksFor (AC-031)
    author: {
      "@type": "Person",
      name: authorName,
      url: `${BASE_URL}/profile/${authorUsername}`,
      ...(authorAvatar && { image: authorAvatar }),
      ...(authorBio && { description: authorBio }),
      ...(authorJobTitle && { jobTitle: authorJobTitle }),
      ...(authorCompany && {
        worksFor: {
          "@type": "Organization",
          name: authorCompany,
        },
      }),
    },
    publisher: {
      "@type": "Organization",
      name: "ChungToiXayWeb",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    // T-053: Image as ImageObject array with caption (AC-030)
    // Fallback: post images > author avatar > default site image
    image: post.images && post.images.length > 0
      ? post.images.map((imgUrl: string, index: number) => ({
          "@type": "ImageObject",
          url: imgUrl,
          caption: `Hình ${index + 1} trong bài viết của ${authorName}`,
        }))
      : authorAvatar
        ? { "@type": "ImageObject", url: authorAvatar, caption: `Ảnh đại diện của ${authorName}` }
        : { "@type": "ImageObject", url: DEFAULT_OG_IMAGE, caption: "ChungToiXayWeb" },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: post._count?.likes ?? post.likeCount ?? 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "CommentAction" },
        userInteractionCount: post._count?.comments ?? post.commentCount ?? 0,
      },
    ],
  }
}

/**
 * Skeleton fallback for RelatedPosts during Suspense
 */
function RelatedPostsSkeleton() {
  return (
    <section className="mt-8 border-t border-border pt-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-border">
            <Skeleton className="aspect-video rounded-md mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Skeleton fallback for RelatedBlogPosts during Suspense
 */
function RelatedBlogPostsSkeleton() {
  return (
    <div className="mt-6">
      <Skeleton className="h-5 w-36 mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-2 rounded-lg border border-border">
            <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId, username } = await params
  const post = await getPost(username, postId)

  if (!post) {
    notFound()
  }

  // Only show published posts in SSR - pending/draft posts should not be server-rendered
  // This prevents unmoderated content from being indexed by search engines
  if (post.status !== "PUBLISHED") {
    notFound()
  }

  const jsonLd = generateJsonLd(post, username)
  const postTitle = truncateText(stripHtmlTags(post.content), 50)
  const authorName = post.author.profile?.displayName || "Người dùng"
  const authorUsername = post.author.profile?.username || username

  // T-054: Calculate reading time for display (AC-032, AC-033, AC-035)
  const imageCount = post.images?.length || 0
  const readingTimeText = formatReadingTime(post.content || '', imageCount)

  // Parse images for server rendering
  const images = parseImages(post.images)
  const sharedPostImages = post.sharedPost ? parseImages(post.sharedPost.images) : []
  const isSharedPost = !!post.sharedPostId

  return (
    <>
      <script
        key="social-media-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO H1 - visually hidden but accessible to crawlers (AC-011) */}
      <h1 className="sr-only">
        {`Bài viết của ${authorName}: ${postTitle}`}
      </h1>

      <div className="max-w-2xl mx-auto px-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: `@${username}`, href: `/profile/${username}` },
            { label: postTitle, truncate: true },
          ]}
        />

        {/* T-054: Reading time display (AC-033, AC-035 - hidden for posts < 50 words) */}
        {readingTimeText && (
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {readingTimeText}
          </p>
        )}
      </div>

      {/* SEO: Server-rendered post content in <article> for crawlers */}
      <article className="max-w-2xl mx-auto px-4">
        <Card className="border-border bg-card rounded-b-none border-b-0">
          {/* Author Header */}
          <CardHeader className="p-4 pb-3">
            <div className="flex items-start gap-3">
              <Link href={`/profile/${authorUsername}`} className="shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getAvatarUrl(post.author.profile?.avatar)}
                    alt={generateAvatarAlt(authorName)}
                  />
                  <AvatarFallback>
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${authorUsername}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {authorName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  @{authorUsername} · {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Post Content - Server rendered for SEO */}
          <CardContent className="px-4 pb-3">
            {/* Main post content */}
            {post.content && (
              <div
                className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-a:text-rose-600 prose-a:underline hover:prose-a:text-rose-700"
                dangerouslySetInnerHTML={{
                  __html: processUGCLinks(post.content, { trusted: false }),
                }}
              />
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.hashtags.map((ph: any) => (
                  <Link
                    key={ph.hashtag?.id || ph.id}
                    href={`/hashtag/${ph.hashtag?.name || ph.name}`}
                    className="text-accent hover:underline text-sm"
                  >
                    #{ph.hashtag?.name || ph.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Shared Post Content */}
            {isSharedPost && (
              <div className="mt-3 border border-border rounded-lg overflow-hidden bg-muted/30">
                {post.sharedPost ? (
                  <>
                    {/* Shared post header */}
                    <div className="p-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Chia sẻ từ{" "}
                        <Link
                          href={`/profile/${post.sharedPost.author?.profile?.username}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          @{post.sharedPost.author?.profile?.username}
                        </Link>
                      </span>
                    </div>

                    {/* Original post content */}
                    <div className="px-3 pb-3">
                      {/* Original author info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getAvatarUrl(post.sharedPost.author?.profile?.avatar)}
                            alt={generateAvatarAlt(post.sharedPost.author?.profile?.displayName || "Người dùng")}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(post.sharedPost.author?.profile?.displayName || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">
                            {post.sharedPost.author?.profile?.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatRelativeTime(post.sharedPost.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Original post text */}
                      <div
                        className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-a:text-rose-600 prose-a:underline hover:prose-a:text-rose-700"
                        dangerouslySetInnerHTML={{
                          __html: processUGCLinks(post.sharedPost.content, { trusted: false }),
                        }}
                      />

                      {/* Original post hashtags */}
                      {post.sharedPost.hashtags && post.sharedPost.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.sharedPost.hashtags.map((ph: any) => (
                            <span
                              key={ph.hashtag?.id || ph.id}
                              className="text-accent text-sm"
                            >
                              #{ph.hashtag?.name || ph.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Original post images */}
                      {sharedPostImages.length > 0 && (
                        <div
                          className={cn(
                            "mt-3 grid gap-0.5 overflow-hidden rounded-md",
                            sharedPostImages.length === 1 && "grid-cols-1",
                            sharedPostImages.length === 2 && "grid-cols-2",
                            sharedPostImages.length >= 3 && "grid-cols-2",
                          )}
                        >
                          {sharedPostImages.slice(0, 4).map((image: string, imgIndex: number) => (
                            <div
                              key={imgIndex}
                              className={cn(
                                "relative aspect-square overflow-hidden bg-secondary",
                                sharedPostImages.length === 3 && imgIndex === 0 && "row-span-2",
                              )}
                            >
                              <Image
                                src={transformImageUrl(image) || image}
                                alt={generatePostImageAlt({
                                  index: imgIndex + 1,
                                  authorName: post.sharedPost?.author?.profile?.displayName || "Người dùng",
                                  postTitle: stripHtmlTags(post.sharedPost?.content || '').substring(0, 50),
                                })}
                                fill
                                className="object-cover"
                                sizes="(max-width: 672px) 100vw, 672px"
                                priority={imgIndex === 0}
                              />
                              {imgIndex === 3 && sharedPostImages.length > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">
                                    +{sharedPostImages.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Original post was deleted */
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Bài viết gốc đã bị xóa hoặc không còn tồn tại</p>
                  </div>
                )}
              </div>
            )}

            {/* Post images (only for non-shared posts) */}
            {!isSharedPost && images.length > 0 && (
              <div
                className={cn(
                  "mt-3 grid gap-0.5 overflow-hidden",
                  images.length === 1 && "grid-cols-1",
                  images.length === 2 && "grid-cols-2",
                  images.length >= 3 && "grid-cols-2",
                )}
              >
                {images.slice(0, 4).map((image: string, imgIndex: number) => (
                  <div
                    key={imgIndex}
                    className={cn(
                      "relative aspect-square overflow-hidden bg-secondary",
                      images.length === 3 && imgIndex === 0 && "row-span-2",
                    )}
                  >
                    <Image
                      src={transformImageUrl(image) || image}
                      alt={generatePostImageAlt({
                        index: imgIndex + 1,
                        authorName: authorName,
                        postTitle: stripHtmlTags(post.content || '').substring(0, 50),
                      })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 672px) 100vw, 672px"
                      priority={imgIndex === 0}
                    />
                    {imgIndex === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          +{images.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </article>

      {/* Client component for interactivity (likes, comments, share) */}
      <PostDetailClient initialPost={post} postId={post.id} username={username} />

      {/* Related posts section for SEO (AC-010, T-027) - wrapped in Suspense for faster initial render */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts postId={post.id} />
      </Suspense>

      {/* Related blog posts for cross-linking - wrapped in Suspense */}
      <div className="max-w-2xl mx-auto px-4">
        <Suspense fallback={<RelatedBlogPostsSkeleton />}>
          <RelatedBlogPosts
            hashtags={post.hashtags?.map((h: any) => h.hashtag?.name || h.name).filter(Boolean) || []}
          />
        </Suspense>
      </div>
    </>
  )
}

