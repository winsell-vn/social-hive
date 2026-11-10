import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Github, Linkedin, Globe } from 'lucide-react'
import { getAvatarUrl } from '@/lib/image-url'
import type { Credential } from '@/types/profile'

interface SocialLinks {
  github?: string
  linkedin?: string
  website?: string
  twitter?: string
  facebook?: string
}

interface AuthorCardProps {
  author: {
    username: string
    displayName: string | null
    avatar: string | null
    bio: string | null
    jobTitle?: string | null
    company?: string | null
    expertise?: string[] | null
    credentials?: Credential[] | null
    isVerifiedExpert?: boolean
    socialLinks?: string | null
  }
  postCount?: number
}

function parseSocialLinks(socialLinksJson: string | null | undefined): SocialLinks | null {
  if (!socialLinksJson) return null
  try {
    return JSON.parse(socialLinksJson) as SocialLinks
  } catch {
    return null
  }
}

export function AuthorCard({ author, postCount }: AuthorCardProps) {
  const authorUrl = `/profile/${author.username}`
  const authorBlogUrl = `/blog?author=${author.username}`
  const displayName = author.displayName || author.username
  const socialLinks = parseSocialLinks(author.socialLinks)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={authorUrl} className="flex-shrink-0">
          {getAvatarUrl(author.avatar) ? (
            <Image
              src={getAvatarUrl(author.avatar)!}
              alt={displayName}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">Tác giả</p>
          
          {/* Name with verified badge */}
          <div className="flex items-center gap-2">
            <Link href={authorUrl} className="font-semibold text-lg hover:text-primary truncate">
              {displayName}
            </Link>
            {author.isVerifiedExpert && (
              <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" aria-label="Chuyên gia đã xác minh" />
            )}
          </div>

          {/* Job Title & Company */}
          {(author.jobTitle || author.company) && (
            <p className="text-sm text-muted-foreground mt-1">
              {author.jobTitle}
              {author.jobTitle && author.company && ' @ '}
              {author.company}
            </p>
          )}

          {/* Bio */}
          {author.bio && (
            <p className="text-muted-foreground mt-3 line-clamp-3">{author.bio}</p>
          )}

          {/* Expertise Tags */}
          {author.expertise && author.expertise.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Chuyên môn:</p>
              <div className="flex flex-wrap gap-2">
                {author.expertise.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {author.expertise.length > 8 && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    +{author.expertise.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {socialLinks && (socialLinks.github || socialLinks.linkedin || socialLinks.website) && (
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {/* Blog Posts Link */}
          {postCount !== undefined && postCount > 0 && (
            <Link
              href={authorBlogUrl}
              className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
            >
              📝 {postCount} bài viết trên ChungToiXayWeb
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

