import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { api } from "@/lib/api"
import { PostPageClient } from "./PostPageClient"
import { generateMetaDescription } from "@/lib/seo/meta-description"
import { stripHtmlTags } from "@/lib/seo/reading-time"
import type { Post } from "@/types/post"

interface PostPageProps {
  params: Promise<{ id: string }>
}

// Server-side data fetching for SEO
async function getPost(id: string): Promise<Post | null> {
  try {
    const response = await api<{ data: Post }>(`/posts/${id}`)
    return response.data
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

// Dynamic metadata for SEO (Open Graph, Twitter Cards)
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return {
      title: "Bài viết không tồn tại | ChungToiXayWeb",
      description: "Bài viết này không tồn tại hoặc đã bị xóa.",
    }
  }

  const authorName = post.author.profile?.displayName || "Người dùng"
  const authorUsername = post.author.profile?.username || post.author.username
  // Use slug for canonical URL if available
  const postIdentifier = post.slug || post.id
  const title = `${authorName} trên ChungToiXayWeb: "${truncateText(stripHtmlTags(post.content), 60)}"`
  const description = generateMetaDescription(post.content, 160)
  const url = `https://chungtoixayweb.vn/profile/${authorUsername}/${postIdentifier}`
  const image = getFirstImage(post.images)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ChungToiXayWeb",
      type: "article",
      publishedTime: post.publishAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [`https://chungtoixayweb.vn/profile/${authorUsername}`],
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: `Bài viết của ${authorName}` }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
      creator: `@${authorUsername}`,
    },
    alternates: {
      canonical: url,
    },
  }
}

// JSON-LD structured data for SEO
function generateJsonLd(post: Post) {
  const authorName = post.author.profile?.displayName || "Người dùng"
  const authorUsername = post.author.profile?.username || post.author.username
  const authorBio = post.author.profile?.bio
  const authorAvatar = post.author.profile?.avatar
  const authorJobTitle = post.author.profile?.jobTitle
  const authorCompany = post.author.profile?.company
  const image = getFirstImage(post.images)
  const postIdentifier = post.slug || post.id

  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: truncateText(post.content, 110),
    articleBody: post.content,
    datePublished: post.publishAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: authorName,
      url: `https://chungtoixayweb.vn/profile/${authorUsername}`,
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
      url: "https://chungtoixayweb.vn",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://chungtoixayweb.vn/profile/${authorUsername}/${postIdentifier}`,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likeCount || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post._count?.comments || post.commentCount || 0,
      },
    ],
    ...(image && { image }),
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  // Only show published posts to guests (SSR doesn't have auth context)
  // Client-side will handle showing pending posts to authors
  if (post.status !== "PUBLISHED" && post.status !== "PENDING") {
    notFound()
  }

  // Redirect to SEO-friendly URL if slug is available
  const authorUsername = post.author.profile?.username || post.author.username
  if (post.slug && authorUsername) {
    redirect(`/profile/${authorUsername}/${post.slug}`)
  }

  const jsonLd = generateJsonLd(post)

  return (
    <>
      <script
        key="post-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostPageClient initialPost={post} postId={id} />
    </>
  )
}

