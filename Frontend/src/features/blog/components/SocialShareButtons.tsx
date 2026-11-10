'use client'

import { Facebook, Twitter, Link2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMounted } from '@/hooks/use-mounted'

interface SocialShareButtonsProps {
  url: string
  title: string
  className?: string
}

export function SocialShareButtons({ url, title, className }: SocialShareButtonsProps) {
  const mounted = useMounted()

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleShareTwitter = () => {
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleShareZalo = () => {
    const shareUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã sao chép liên kết!')
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Đã sao chép liên kết!')
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm text-muted-foreground">Chia sẻ:</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-9 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const buttonClass =
    'flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Chia sẻ:</span>
      <div className="flex gap-2">
        <button
          onClick={handleShareFacebook}
          className={cn(
            buttonClass,
            'bg-[#1877F2] text-white hover:bg-[#1877F2]/90 focus:ring-[#1877F2]'
          )}
          aria-label="Chia sẻ lên Facebook"
          type="button"
        >
          <Facebook className="h-4 w-4" />
        </button>

        <button
          onClick={handleShareZalo}
          className={cn(
            buttonClass,
            'bg-[#0068FF] text-white hover:bg-[#0068FF]/90 focus:ring-[#0068FF]'
          )}
          aria-label="Chia sẻ lên Zalo"
          type="button"
        >
          <MessageCircle className="h-4 w-4" />
        </button>

        <button
          onClick={handleShareTwitter}
          className={cn(
            buttonClass,
            'bg-black text-white hover:bg-black/80 focus:ring-black dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white'
          )}
          aria-label="Chia sẻ lên X (Twitter)"
          type="button"
        >
          <Twitter className="h-4 w-4" />
        </button>

        <button
          onClick={handleCopyLink}
          className={cn(
            buttonClass,
            'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:ring-primary'
          )}
          aria-label="Sao chép liên kết"
          type="button"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

