import { Metadata } from "next"
import { api } from "@/lib/api"
import { ProfilePageClient } from "./ProfilePageClient"
import { Breadcrumb } from "@/components/seo"
import type { UserProfile } from "@/types/profile"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

// Server-side data fetching for SEO
async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    const response = await api<{ data: UserProfile }>(`/profiles/${username}`)
    return response.data
  } catch {
    return null
  }
}

// Dynamic metadata for SEO (Open Graph, Twitter Cards)
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username)

  if (!profile) {
    return {
      title: "Người dùng không tồn tại | ChungToiXayWeb",
      description: "Người dùng này không tồn tại hoặc đã bị xóa.",
    }
  }

  const title = `${profile.displayName} (@${profile.username}) | ChungToiXayWeb`
  const description = profile.bio || `Xem trang cá nhân của ${profile.displayName} trên ChungToiXayWeb`
  const url = `https://chungtoixayweb.vn/profile/${profile.username}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ChungToiXayWeb",
      type: "profile",
      images: profile.avatar
        ? [{ url: profile.avatar, width: 400, height: 400, alt: profile.displayName }]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatar ? [profile.avatar] : undefined,
      creator: `@${profile.username}`,
    },
    alternates: {
      canonical: url,
    },
  }
}

// JSON-LD structured data for SEO
function generateJsonLd(profile: UserProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: profile.username,
      description: profile.bio || undefined,
      url: `https://chungtoixayweb.vn/profile/${profile.username}`,
      image: profile.avatar || undefined,
      sameAs: profile.website ? [profile.website] : undefined,
      // Author Authority Enhancement (T-097): Add expertise fields to Person schema
      ...(profile.jobTitle && { jobTitle: profile.jobTitle }),
      ...(profile.company && {
        worksFor: {
          "@type": "Organization",
          name: profile.company,
        },
      }),
      ...(profile.expertise && profile.expertise.length > 0 && {
        knowsAbout: profile.expertise,
      }),
      ...(profile.location && {
        address: {
          "@type": "PostalAddress",
          addressLocality: profile.location,
        },
      }),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: profile.followerCount || 0,
        },
      ],
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const profile = await getProfile(username)

  const jsonLd = profile ? generateJsonLd(profile) : null

  return (
    <>
      {jsonLd && (
        <script
          key="profile-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="px-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: `@${username}` },
          ]}
        />
      </div>
      <ProfilePageClient initialProfile={profile} username={username} />
    </>
  )
}

