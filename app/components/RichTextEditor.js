'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import Youtube from '@tiptap/extension-youtube'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Node, mergeAttributes } from '@tiptap/core'
import { useCallback, useState, useEffect, useRef } from 'react'

// Callout/Box extension for content blocks with background
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      backgroundColor: {
        default: '#f3f4f6',
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || '#f3f4f6',
        renderHTML: attributes => ({
          'data-background-color': attributes.backgroundColor,
        }),
      },
      borderColor: {
        default: '#e5e7eb',
        parseHTML: element => element.getAttribute('data-border-color') || '#e5e7eb',
        renderHTML: attributes => ({
          'data-border-color': attributes.borderColor,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: 'callout-box',
        style: `background-color: ${node.attrs.backgroundColor}; border: 1px solid ${node.attrs.borderColor}; border-radius: 8px; padding: 16px; margin: 12px 0;`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout: (attributes) => ({ chain, state }) => {
        const { from, to } = state.selection

        // If there's a selection, wrap it
        if (from !== to) {
          return chain()
            .wrapIn(this.name, attributes)
            .run()
        }

        // Otherwise, insert an empty callout with a paragraph
        return chain()
          .insertContent({
            type: this.name,
            attrs: attributes,
            content: [{ type: 'paragraph' }],
          })
          .run()
      },
      toggleCallout: (attributes) => ({ chain, state, editor }) => {
        // Check if we're already in a callout
        const isActive = editor.isActive('callout')

        if (isActive) {
          // Lift content out of callout
          return chain().lift(this.name).run()
        }

        const { from, to } = state.selection

        // If there's a selection, wrap it
        if (from !== to) {
          return chain()
            .wrapIn(this.name, attributes)
            .run()
        }

        // Otherwise, insert an empty callout
        return chain()
          .insertContent({
            type: this.name,
            attrs: attributes,
            content: [{ type: 'paragraph' }],
          })
          .run()
      },
      unsetCallout: () => ({ chain }) => {
        return chain().lift(this.name).run()
      },
    }
  },
})

// Custom TableCell extension with inline styles
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || null,
        renderHTML: attributes => {
          return {}
        },
      },
      borderColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-color') || null,
        renderHTML: attributes => {
          return {}
        },
      },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    const bgColor = node.attrs.backgroundColor
    const borderColor = node.attrs.borderColor || '#d1d5db'
    let style = `border: 1px solid ${borderColor}; padding: 12px 16px; text-align: left;`
    if (bgColor) {
      style += ` background-color: ${bgColor};`
    }
    return ['td', mergeAttributes(HTMLAttributes, { style }), 0]
  },
})

// Custom TableHeader extension with inline styles
const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: '#f3f4f6',
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || '#f3f4f6',
        renderHTML: attributes => {
          return {}
        },
      },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    const bgColor = node.attrs.backgroundColor || '#f3f4f6'
    const style = `border: 1px solid #d1d5db; padding: 12px 16px; text-align: left; background-color: ${bgColor}; font-weight: 600;`
    return ['th', mergeAttributes(HTMLAttributes, { style }), 0]
  },
})

// Custom Table extension with inline styles
const CustomTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return ['table', mergeAttributes(HTMLAttributes, {
      style: 'border-collapse: collapse; width: 100%; margin: 1rem 0;'
    }), ['tbody', 0]]
  },
})

// Custom TaskList with inline styles
const CustomTaskList = TaskList.extend({
  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(HTMLAttributes, {
      'data-type': 'taskList',
      style: 'list-style: none; padding-left: 0; margin: 0.5em 0;'
    }), 0]
  },
})

// Custom TaskItem with inline styles
const CustomTaskItem = TaskItem.extend({
  renderHTML({ node, HTMLAttributes }) {
    const checked = node.attrs.checked
    const listItemStyle = 'display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.5rem 0;'
    const labelStyle = 'flex-shrink: 0; margin-top: 0.25rem;'
    const checkboxStyle = 'width: 1rem; height: 1rem; cursor: pointer; accent-color: #3b82f6;'
    const contentStyle = checked
      ? 'flex: 1; text-decoration: line-through; color: #9ca3af;'
      : 'flex: 1;'

    return [
      'li',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'taskItem',
        'data-checked': checked ? 'true' : 'false',
        style: listItemStyle
      }),
      [
        'label',
        { style: labelStyle },
        [
          'input',
          {
            type: 'checkbox',
            checked: checked ? 'checked' : null,
            style: checkboxStyle,
          },
        ],
      ],
      ['div', { style: contentStyle }, 0],
    ]
  },
})

// Custom BulletList with inline styles
const CustomBulletList = BulletList.extend({
  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(HTMLAttributes, {
      style: 'list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0;'
    }), 0]
  },
})

// Custom OrderedList with inline styles
const CustomOrderedList = OrderedList.extend({
  renderHTML({ HTMLAttributes }) {
    return ['ol', mergeAttributes(HTMLAttributes, {
      style: 'list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0;'
    }), 0]
  },
})

// Custom ListItem with inline styles
const CustomListItem = ListItem.extend({
  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(HTMLAttributes, {
      style: 'margin: 0.25em 0;'
    }), 0]
  },
})

// Font size extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {}
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          }
        },
      },
    }
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

// Common emojis for quick access
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😊', '🙂', '😉', '😍', '🥰', '😘',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👌', '🎉',
  '❤️', '💯', '⭐', '🔥', '✅', '❌', '⚠️', '💡', '📌', '📝',
  '📚', '🎓', '🏆', '🥇', '🎯', '📈', '💰', '🏠', '🏫', '🌟',
]

export default function RichTextEditor({ content, onChange, placeholder = 'Start typing...' }) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [showTableColorPicker, setShowTableColorPicker] = useState(false)
  const [showTableHeaderColorPicker, setShowTableHeaderColorPicker] = useState(false)
  const [showTableBorderPicker, setShowTableBorderPicker] = useState(false)
  const [showCalloutPicker, setShowCalloutPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      CustomBulletList,
      CustomOrderedList,
      CustomListItem,
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #2563eb; text-decoration: underline;',
        },
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CustomTable.configure({
        resizable: true,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          style: 'width: 100%; aspect-ratio: 16/9; margin: 1rem 0;',
        },
      }),
      Callout,
      CustomTaskList,
      CustomTaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: null,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      onChange(editor.getHTML())
    },
  })

  // Sync editor content when content prop changes from external source
  useEffect(() => {
    if (editor && content !== undefined) {
      if (!isInternalUpdate.current) {
        const currentContent = editor.getHTML()
        if (currentContent !== content) {
          editor.commands.setContent(content || '', false)
        }
      }
      isInternalUpdate.current = false
    }
  }, [content, editor])

  const closeAllPickers = () => {
    setShowColorPicker(false)
    setShowHighlightPicker(false)
    setShowFontSizePicker(false)
    setShowTableColorPicker(false)
    setShowTableHeaderColorPicker(false)
    setShowTableBorderPicker(false)
    setShowCalloutPicker(false)
    setShowEmojiPicker(false)
  }

  const insertEmoji = useCallback((emoji) => {
    editor.chain().focus().insertContent(emoji).run()
    setShowEmojiPicker(false)
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const addYouTube = useCallback(() => {
    const url = window.prompt('Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)')

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 360,
      })
    }
  }, [editor])

  const setCellBackgroundColor = useCallback((color) => {
    if (color) {
      editor.chain().focus().setCellAttribute('backgroundColor', color).run()
    } else {
      editor.chain().focus().setCellAttribute('backgroundColor', null).run()
    }
  }, [editor])

  const setTableBorder = useCallback((color) => {
    if (color) {
      editor.chain().focus().setCellAttribute('borderColor', color).run()
    } else {
      editor.chain().focus().setCellAttribute('borderColor', null).run()
    }
  }, [editor])

  // Extended color palette
  const textColors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  ]

  const highlightColors = [
    '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#0000FF',
    '#FFD700', '#90EE90', '#87CEEB', '#FFB6C1', '#FFA07A', '#DDA0DD',
    '#F0E68C', '#98FB98', '#E6E6FA', '#FFDAB9', '#B0E0E6', '#FFEFD5',
  ]

  const fontSizes = [
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: '16px' },
    { label: 'Medium', value: '18px' },
    { label: 'Large', value: '24px' },
    { label: 'X-Large', value: '32px' },
    { label: 'XX-Large', value: '48px' },
  ]

  const tableCellColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af',
    '#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706',
    '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981',
    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6',
    '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6',
    '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
    '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444',
  ]

  const borderColors = [
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
  ]

  const calloutColors = [
    { bg: '#f3f4f6', border: '#e5e7eb', label: 'Gray' },
    { bg: '#fef3c7', border: '#fcd34d', label: 'Yellow' },
    { bg: '#d1fae5', border: '#6ee7b7', label: 'Green' },
    { bg: '#dbeafe', border: '#93c5fd', label: 'Blue' },
    { bg: '#ede9fe', border: '#c4b5fd', label: 'Purple' },
    { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink' },
    { bg: '#fee2e2', border: '#fca5a5', label: 'Red' },
    { bg: '#fff7ed', border: '#fdba74', label: 'Orange' },
  ]

  if (!editor) {
    return null
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-300">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-300 font-bold' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-300 italic' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m0 0h6m-6 0H8" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('underline') ? 'bg-slate-300 underline' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <span className="font-semibold underline">U</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-300 line-through' : ''}`}
          title="Strikethrough"
        >
          <span className="font-semibold line-through">S</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('subscript') ? 'bg-slate-300' : ''}`}
          title="Subscript"
        >
          <span className="text-sm">X<sub className="text-xs">2</sub></span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('superscript') ? 'bg-slate-300' : ''}`}
          title="Superscript"
        >
          <span className="text-sm">X<sup className="text-xs">2</sup></span>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              closeAllPickers()
              setShowFontSizePicker(!showFontSizePicker)
            }}
            className="px-2 py-1 rounded hover:bg-slate-200 text-sm flex items-center gap-1"
            title="Font Size"
          >
            <span>Size</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFontSizePicker && (
            <div className="absolute top-full left-0 mt-1 p-1 bg-white border border-slate-300 rounded shadow-lg z-20 min-w-[120px]">
              {fontSizes.map(size => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setFontSize(size.value).run()
                    setShowFontSizePicker(false)
                  }}
                  className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded"
                  style={{ fontSize: size.value }}
                >
                  {size.label}
                </button>
              ))}
              <hr className="my-1 border-slate-200" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetFontSize().run()
                  setShowFontSizePicker(false)
                }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded text-slate-500"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              closeAllPickers()
              setShowColorPicker(!showColorPicker)
            }}
            className="p-2 rounded hover:bg-slate-200 flex items-center"
            title="Text Color"
          >
            <span className="w-5 h-5 flex items-center justify-center font-bold">A</span>
            <span className="w-5 h-1 bg-red-500 -mt-3 ml-[-20px]"></span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-56">
              <div className="text-xs font-medium text-slate-500 mb-2">Text Color</div>
              <div className="grid grid-cols-10 gap-1">
                {textColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run()
                      setShowColorPicker(false)
                    }}
                    className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
                className="w-full mt-2 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Reset Color
              </button>
            </div>
          )}
        </div>

        {/* Highlight/Background Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              closeAllPickers()
              setShowHighlightPicker(!showHighlightPicker)
            }}
            className="p-2 rounded hover:bg-slate-200"
            title="Background/Highlight Color"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-56">
              <div className="text-xs font-medium text-slate-500 mb-2">Highlight Color</div>
              <div className="grid grid-cols-6 gap-1">
                {highlightColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run()
                      setShowHighlightPicker(false)
                    }}
                    className="w-7 h-7 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run()
                  setShowHighlightPicker(false)
                }}
                className="w-full mt-2 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Remove Highlight
              </button>
            </div>
          )}
        </div>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded hover:bg-slate-200 font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-300' : ''}`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded hover:bg-slate-200 font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-300' : ''}`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded hover:bg-slate-200 font-bold text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-300' : ''}`}
          title="Heading 3"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={`px-2 py-1 rounded hover:bg-slate-200 font-bold text-sm ${editor.isActive('heading', { level: 4 }) ? 'bg-slate-300' : ''}`}
          title="Heading 4"
        >
          H4
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-300' : ''}`}
          title="Bullet List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-300' : ''}`}
          title="Numbered List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Task List / Checklist */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('taskList') ? 'bg-slate-300' : ''}`}
          title="Task List / Checklist"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('blockquote') ? 'bg-slate-300' : ''}`}
          title="Quote"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>

        {/* Callout Box */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              closeAllPickers()
              setShowCalloutPicker(!showCalloutPicker)
            }}
            className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('callout') ? 'bg-slate-300' : ''}`}
            title="Callout Box / Content Block"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          {showCalloutPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-48">
              <div className="text-xs font-medium text-slate-500 mb-2">Callout Box</div>
              <div className="space-y-1">
                {calloutColors.map((color) => (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleCallout({ backgroundColor: color.bg, borderColor: color.border }).run()
                      setShowCalloutPicker(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-slate-100 rounded"
                  >
                    <span
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: color.bg, borderColor: color.border }}
                    />
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
              {editor.isActive('callout') && (
                <>
                  <hr className="my-2 border-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetCallout().run()
                      setShowCalloutPicker(false)
                    }}
                    className="w-full px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded"
                  >
                    Remove Box
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-300' : ''}`}
          title="Align Left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-300' : ''}`}
          title="Align Center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-300' : ''}`}
          title="Align Right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Link & Image & YouTube */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('link') ? 'bg-slate-300' : ''}`}
          title="Add Link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-slate-200"
          title="Add Image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={addYouTube}
          className="p-2 rounded hover:bg-slate-200"
          title="Add YouTube Video"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Table */}
        <button
          type="button"
          onClick={insertTable}
          className="p-2 rounded hover:bg-slate-200"
          title="Insert Table"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {editor.isActive('table') && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200"
              title="Add Column Before"
            >
              +Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200"
              title="Add Row Before"
            >
              +Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200"
              title="Delete Column"
            >
              -Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200"
              title="Delete Row"
            >
              -Row
            </button>

            {/* Table Cell Background Color */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  closeAllPickers()
                  setShowTableColorPicker(!showTableColorPicker)
                }}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 flex items-center gap-1"
                title="Cell Background Color"
              >
                <span className="w-3 h-3 bg-yellow-200 border border-slate-300 rounded"></span>
                Cell
              </button>
              {showTableColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-56">
                  <div className="text-xs font-medium text-slate-500 mb-2">Cell Background</div>
                  <div className="grid grid-cols-7 gap-1">
                    {tableCellColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setCellBackgroundColor(color)
                          setShowTableColorPicker(false)
                        }}
                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCellBackgroundColor(null)
                      setShowTableColorPicker(false)
                    }}
                    className="w-full mt-2 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    Remove Background
                  </button>
                </div>
              )}
            </div>

            {/* Table Border Color */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  closeAllPickers()
                  setShowTableBorderPicker(!showTableBorderPicker)
                }}
                className="px-2 py-1 text-xs rounded hover:bg-slate-200 flex items-center gap-1"
                title="Cell Border Color"
              >
                <span className="w-3 h-3 border-2 border-blue-500 rounded"></span>
                Border
              </button>
              {showTableBorderPicker && (
                <div className="absolute top-full right-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-48">
                  <div className="text-xs font-medium text-slate-500 mb-2">Border Color</div>
                  <div className="grid grid-cols-6 gap-1">
                    {borderColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setTableBorder(color)
                          setShowTableBorderPicker(false)
                        }}
                        className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                        style={{ borderColor: color, backgroundColor: 'white' }}
                        title={color}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTableBorder(null)
                      setShowTableBorderPicker(false)
                    }}
                    className="w-full mt-2 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    Reset Border
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200"
              title="Toggle Header Row"
            >
              Header
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-1 text-xs rounded hover:bg-red-100 text-red-600"
              title="Delete Table"
            >
              Delete
            </button>
          </>
        )}

        <div className="w-px bg-slate-300 mx-1" />

        {/* Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('code') ? 'bg-slate-300' : ''}`}
          title="Inline Code"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('codeBlock') ? 'bg-slate-300' : ''}`}
          title="Code Block"
        >
          <span className="font-mono text-sm">{`{}`}</span>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-slate-200"
          title="Horizontal Line"
        >
          <span className="font-bold">—</span>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-slate-200 disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-slate-200 disabled:opacity-30"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              closeAllPickers()
              setShowEmojiPicker(!showEmojiPicker)
            }}
            className="p-2 rounded hover:bg-slate-200"
            title="Insert Emoji"
          >
            <span className="text-lg">😀</span>
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full right-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-20 w-64">
              <div className="text-xs font-medium text-slate-500 mb-2">Insert Emoji</div>
              <div className="grid grid-cols-10 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-6 h-6 text-lg hover:bg-slate-100 rounded flex items-center justify-center"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px bg-slate-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-2 py-1 text-xs rounded hover:bg-slate-200"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word and Character Count */}
      <div className="flex items-center justify-end gap-4 px-4 py-2 bg-slate-50 border-t border-slate-300 text-xs text-slate-500">
        <span>
          {editor.storage.characterCount.words()} words
        </span>
        <span>
          {editor.storage.characterCount.characters()} characters
        </span>
      </div>

      {/* Editor Styles for Tables */}
      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #d1d5db;
          box-sizing: border-box;
          min-width: 1em;
          padding: 8px 12px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: left;
        }
        .ProseMirror .selectedCell:after {
          background: rgba(59, 130, 246, 0.1);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .ProseMirror .column-resize-handle {
          background-color: #3b82f6;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }
        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }
        .ProseMirror .callout-box {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .ProseMirror .callout-box p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror .callout-box p:first-child {
          margin-top: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ul ul {
          list-style-type: circle;
        }
        .ProseMirror ul ul ul {
          list-style-type: square;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ol ol {
          list-style-type: lower-alpha;
        }
        .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror li p {
          margin: 0;
        }
        /* Task List Styles */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.25em 0;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: #3b82f6;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #9ca3af;
        }
        /* Nested Task Lists */
        .ProseMirror ul[data-type="taskList"] ul[data-type="taskList"] {
          margin-left: 1.5rem;
        }
        /* Placeholder Styles */
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
