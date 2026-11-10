'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  minHeight?: string;
  onPasteImage?: (file: File) => Promise<string>;
  /** When false, pasted images are handled by onPasteImage but NOT inserted into editor content. Default: true */
  insertPastedImage?: boolean;
  /** Callback when Enter key is pressed (without Shift). Return true to prevent default behavior. */
  onEnterSubmit?: () => boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Viết nội dung của bạn...',
  editable = true,
  className,
  showToolbar = true,
  minHeight = 'min-h-[200px]',
  onPasteImage,
  insertPastedImage = true,
  onEnterSubmit,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Link and Underline are bundled into StarterKit in TipTap v3.
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-rose-600 underline hover:text-rose-700',
            // SEO: Add rel attributes for user-generated content links
            rel: 'ugc nofollow noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none focus:outline-none px-4 py-3',
          minHeight,
          '[&_.is-editor-empty:first-child::before]:text-gray-400',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.is-editor-empty:first-child::before]:float-left',
          '[&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:pointer-events-none'
        ),
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key for submission (without Shift)
        if (event.key === 'Enter' && !event.shiftKey && onEnterSubmit) {
          // Don't submit if we're in a list or code block
          const { state } = view;
          const { $from } = state.selection;

          // Check if we're in a list item or code block
          const inListItem = $from.node(-1)?.type.name === 'listItem';
          const inCodeBlock = $from.parent.type.name === 'codeBlock';

          if (!inListItem && !inCodeBlock) {
            const shouldPreventDefault = onEnterSubmit();
            if (shouldPreventDefault) {
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items || !onPasteImage) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              onPasteImage(file).then((url) => {
                if (url && editor && insertPastedImage) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // Method to insert emoji at cursor
  const insertEmoji = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
    }
  };

  // Method to insert image
  const insertImage = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Method to set link
  const setLink = (url: string) => {
    if (editor) {
      if (url) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card',
        'focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-white/20 dark:focus-within:border-white dark:focus-within:ring-white/20',
        'transition-all duration-200',
        className
      )}
    >
      {showToolbar && (
        <EditorToolbar
          editor={editor}
          onInsertEmoji={insertEmoji}
          onInsertImage={insertImage}
          onSetLink={setLink}
        />
      )}

      {editor && editable && (
        <BubbleMenu
          editor={editor}
          className="bg-white dark:bg-popover shadow-lg rounded-lg border border-border p-1 flex gap-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary text-foreground',
              editor.isActive('bold') && 'bg-gray-100 dark:bg-secondary text-rose-600'
            )}
            title="Đậm"
          >
            <span className="font-bold text-sm">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary text-foreground',
              editor.isActive('italic') && 'bg-gray-100 dark:bg-secondary text-rose-600'
            )}
            title="Nghiêng"
          >
            <span className="italic text-sm">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary text-foreground',
              editor.isActive('underline') && 'bg-gray-100 dark:bg-secondary text-rose-600'
            )}
            title="Gạch chân"
          >
            <span className="underline text-sm">U</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-secondary text-foreground',
              editor.isActive('strike') && 'bg-gray-100 dark:bg-secondary text-rose-600'
            )}
            title="Gạch ngang"
          >
            <span className="line-through text-sm">S</span>
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

export { RichTextEditor as default };

