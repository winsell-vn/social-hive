/** Social media links for profile */
export interface SocialLinks {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  github?: string
  website?: string
  youtube?: string
  tiktok?: string
}

/** Portfolio item for profile */
export interface PortfolioItem {
  title: string
  description?: string
  url: string
  imageUrl?: string
}

/** Credential/certification for profile (E-E-A-T signal) */
export interface Credential {
  title: string
  description?: string
  issuedBy?: string
  year?: number
}

export interface UserProfile {
  id: string
  userId: string
  username: string  // username is at profile level from backend
  displayName: string
  bio: string | null
  avatar: string | null
  coverPhoto: string | null  // backend returns coverPhoto, not coverImage
  location?: string | null
  website?: string | null
  socialLinks?: SocialLinks | null
  portfolio?: PortfolioItem[] | null
  isPrivate?: boolean
  followerCount: number
  followingCount: number
  postCount?: number  // optional - backend doesn't return this directly
  tier?: string  // optional - not always in backend response
  jobTitle?: string | null
  company?: string | null
  expertise?: string[] | null
  credentials?: Credential[] | null
  isVerifiedExpert?: boolean
  user: {
    id: string
    role: string
    createdAt: string
    _count?: {
      posts: number
      followers: number
      following: number
    }
  }
}

export interface UpdateProfileInput {
  displayName?: string
  bio?: string
  avatar?: string
  coverPhoto?: string
  location?: string
  website?: string
  jobTitle?: string
  company?: string
  expertise?: string[]
}

