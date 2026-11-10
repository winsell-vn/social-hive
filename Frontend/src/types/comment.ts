export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  authorId: string
  postId: string
  parentId: string | null
  author: {
    id: string
    username: string
    profile: {
      displayName: string
      avatar: string | null
    }
  }
  _count: {
    likes: number
    replies: number
  }
  replies?: Comment[]
}

export interface CreateCommentInput {
  content: string
  parentId?: string
}

export interface UpdateCommentInput {
  content: string
}

