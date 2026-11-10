'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Minus, Undo, Redo, Link, Smile, ImageIcon } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Dynamic import for heavy EmojiPicker component
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="w-[350px] h-[400px] flex items-center justify-center bg-muted rounded-lg">
      <div className="text-sm text-muted-foreground">Đang tải...</div>
    </div>
  ),
});

interface EditorToolbarProps {
  editor: Editor;
  onInsertEmoji?: (emoji: string) => void;
  onInsertImage?: (url: string) => void;
  onSetLink?: (url: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded hover:bg-gray-100 dark:hover:bg-secondary transition-colors text-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && 'bg-gray-200 dark:bg-secondary text-rose-600'
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({
  editor,
  onInsertEmoji,
  onInsertImage,
  onSetLink,
  onImageUpload,
}: EditorToolbarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const isEditable = editor.isEditable;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (onInsertEmoji) {
      onInsertEmoji(emojiData.emoji);
    } else {
      editor.chain().focus().insertContent(emojiData.emoji).run();
    }
    setShowEmojiPicker(false);
  };

  const handleLinkSubmit = () => {
    if (linkUrl) {
      if (onSetLink) {
        onSetLink(linkUrl);
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onImageUpload) {
      try {
        const url = await onImageUpload(file);
        if (onInsertImage) {
          onInsertImage(url);
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-border bg-gray-50 dark:bg-muted">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={!isEditable}
        title="Đậm (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={!isEditable}
        title="Nghiêng (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        disabled={!isEditable}
        title="Gạch chân (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        disabled={!isEditable}
        title="Gạch ngang"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        disabled={!isEditable}
        title="Code inline"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-border mx-1" />

      {/* Link */}
      <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={!isEditable}
            title="Chèn liên kết"
            className={cn(
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-secondary transition-colors text-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              editor.isActive('link') && 'bg-gray-200 dark:bg-secondary text-rose-600'
            )}
          >
            <Link className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL liên kết</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLinkSubmit}
                className="flex-1 px-3 py-1.5 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700"
              >
                Chèn
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setShowLinkInput(false);
                }}
                className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-secondary text-foreground"
              >
                Xóa link
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-gray-300 dark:bg-border mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        disabled={!isEditable}
        title="Tiêu đề 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        disabled={!isEditable}
        title="Tiêu đề 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-border mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={!isEditable}
        title="Danh sách"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={!isEditable}
        title="Danh sách đánh số"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-border mx-1" />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        disabled={!isEditable}
        title="Trích dẫn"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={!isEditable}
        title="Đường kẻ ngang"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-border mx-1" />

      {/* Emoji Picker */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={!isEditable}
            title="Chèn emoji"
            className={cn(
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-secondary transition-colors text-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Smile className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0" align="start">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={350}
            height={400}
            searchPlaceholder="Tìm emoji..."
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>

      {/* Image Upload */}
      {onImageUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEditable}
            title="Chèn ảnh"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!isEditable || !editor.can().undo()}
        title="Hoàn tác (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!isEditable || !editor.can().redo()}
        title="Làm lại (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

