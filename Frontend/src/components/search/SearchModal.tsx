'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

interface SearchModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchModal({ open: controlledOpen, onOpenChange }: SearchModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    }
    setInternalOpen(value)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        {/* Visually hidden title for screen reader accessibility */}
        <DialogTitle className="sr-only">Tìm kiếm</DialogTitle>
        <form onSubmit={handleSearch} className="flex flex-col">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Tìm kiếm bài viết, người dùng, hashtag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base ml-3 placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            {query ? `Tìm kiếm: "${query}"` : 'Nhập từ khóa để tìm kiếm'}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
