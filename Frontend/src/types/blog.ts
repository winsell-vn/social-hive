export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type BlogPostType = 'ARTICLE' | 'TUTORIAL' | 'COMPARISON' | 'FAQ'

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  displayOrder: number
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface BlogPostAuthor {
  id: string
  username: string
  displayName: string | null
  avatar: string | null
  bio: string | null
  jobTitle?: string | null
  company?: string | null
  expertise?: string[] | null
  socialLinks?: string | null
  isVerifiedExpert?: boolean
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  categoryId: string
  category: BlogCategory
  authorId: string
  author: BlogPostAuthor
  status: BlogPostStatus
  postType: BlogPostType
  tags: string[]
  publishedAt: string | null
  viewCount: number
  readingTime: number
  tableOfContents: TocItem[] | null
  takeaways: string[] | null
  metaTitle: string | null
  metaDescription: string | null
  createdAt: string
  updatedAt: string
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export interface BlogListResponse {
  data: BlogPost[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

