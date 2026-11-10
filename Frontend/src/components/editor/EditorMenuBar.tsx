'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Code2,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface EditorMenuBarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function MenuButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary transition-colors text-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && 'bg-rose-100 dark:bg-secondary text-rose-600'
      )}
    >
      {children}
    </button>
  );
}

export function EditorMenuBar({ editor, onImageUpload }: EditorMenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const isEditable = editor.isEditable;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Text formatting */}
      <div className="flex items-center gap-0.5 mr-2">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={!isEditable}
          title="Đậm"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={!isEditable}
          title="Nghiêng"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          disabled={!isEditable}
          title="Gạch ngang"
        >
          <Strikethrough className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          disabled={!isEditable}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 mr-2 border-l border-gray-200 dark:border-border pl-2">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          disabled={!isEditable}
          title="Tiêu đề 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          disabled={!isEditable}
          title="Tiêu đề 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          disabled={!isEditable}
          title="Tiêu đề 3"
        >
          <Heading3 className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Lists & Blocks */}
      <div className="flex items-center gap-0.5 mr-2 border-l border-gray-200 dark:border-border pl-2">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          disabled={!isEditable}
          title="Danh sách"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          disabled={!isEditable}
          title="Danh sách đánh số"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          disabled={!isEditable}
          title="Trích dẫn"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          disabled={!isEditable}
          title="Khối code"
        >
          <Code2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={!isEditable}
          title="Đường kẻ ngang"
        >
          <Minus className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Image */}
      {onImageUpload && (
        <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-border pl-2">
          <MenuButton
            onClick={handleImageClick}
            disabled={!isEditable}
            title="Chèn ảnh"
          >
            <ImageIcon className="h-4 w-4" />
          </MenuButton>
        </div>
      )}
    </div>
  );
}

