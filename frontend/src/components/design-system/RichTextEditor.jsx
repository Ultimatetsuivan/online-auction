import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiLink,
  FiImage,
  FiCode,
} from 'react-icons/fi';
import clsx from 'clsx';

/**
 * Modern Rich Text Editor Component
 *
 * Built with Tiptap, styled with design system
 * Features: Bold, Italic, Lists, Links, Images, Text Alignment
 */
export const RichTextEditor = ({
  value = '',
  onChange,
  label,
  placeholder = 'Start typing...',
  error,
  helperText,
  required = false,
  className = '',
  minHeight = '200px',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-500 underline hover:text-primary-600',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'p-2 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary-500 text-white'
          : 'text-neutral-700 hover:bg-neutral-100',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
      )}
    >
      <Icon size={18} />
    </button>
  );

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={clsx('form-group-modern', className)}>
      {label && (
        <label className="label-modern">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={clsx(
          'border rounded-lg overflow-hidden transition-all duration-200',
          error ? 'border-red-500' : 'border-neutral-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
          'bg-white'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 bg-neutral-50 border-b border-neutral-200">
          {/* Text Formatting */}
          <div className="flex gap-1 pr-2 border-r border-neutral-300">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={FiBold}
              title="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={FiItalic}
              title="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              icon={FiUnderline}
              title="Strikethrough"
            />
          </div>

          {/* Lists */}
          <div className="flex gap-1 pr-2 border-r border-neutral-300">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              icon={FiList}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              icon={FiCode}
              title="Numbered List"
            />
          </div>

          {/* Alignment */}
          <div className="flex gap-1 pr-2 border-r border-neutral-300">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              icon={FiAlignLeft}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              icon={FiAlignCenter}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              icon={FiAlignRight}
              title="Align Right"
            />
          </div>

          {/* Insert */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive('link')}
              icon={FiLink}
              title="Insert Link"
            />
            <ToolbarButton
              onClick={addImage}
              isActive={false}
              icon={FiImage}
              title="Insert Image"
            />
          </div>
        </div>

        {/* Editor Content */}
        <div style={{ minHeight }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && (
        <p className="error-text flex items-center gap-1 mt-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="helper-text mt-1.5">{helperText}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
