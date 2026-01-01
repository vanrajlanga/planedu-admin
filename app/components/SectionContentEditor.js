'use client'

import { useState, useEffect } from 'react'
import { contentAPI, authorAPI } from '@/lib/api'
import RichTextEditor from './RichTextEditor'
import toast from 'react-hot-toast'

/**
 * Reusable content editor component for college section pages.
 * Provides rich text editing with author selection, SEO fields, and publish controls.
 *
 * @param {Object} props
 * @param {string} props.collegeId - The college ID
 * @param {string} props.sectionType - The section type (e.g., 'courses', 'placement', 'cutoff', 'ranking')
 * @param {string} props.sectionLabel - Display label for the section (e.g., 'Courses & Fees')
 * @param {string} props.collegeName - College name for placeholder text
 */
export default function SectionContentEditor({ collegeId, sectionType, sectionLabel, collegeName }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState([])
  const [contentData, setContentData] = useState(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showSeoFields, setShowSeoFields] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_id: '',
    meta_title: '',
    meta_description: '',
    status: 'draft',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId, sectionType])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contentRes, authorsRes] = await Promise.all([
        contentAPI.getSection(collegeId, sectionType),
        authorAPI.getAuthorsList(),
      ])

      if (authorsRes.data.success) {
        setAuthors(authorsRes.data.data || [])
      }

      if (contentRes.data.success) {
        const content = contentRes.data.data?.content
        setContentData(content)
        if (content) {
          setFormData({
            title: content.title || '',
            content: content.content || '',
            author_id: content.author_id || '',
            meta_title: content.meta_title || '',
            meta_description: content.meta_description || '',
            status: content.status || 'draft',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch content data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (html) => {
    setFormData((prev) => ({ ...prev, content: html }))
  }

  const handleSave = async (publishStatus) => {
    try {
      setSaving(true)
      const dataToSave = {
        ...formData,
        status: publishStatus,
      }

      const response = await contentAPI.updateSection(collegeId, sectionType, dataToSave)

      if (response.data.success) {
        setContentData((prev) => ({
          ...prev,
          ...dataToSave,
          updated_at: new Date().toISOString(),
        }))
        setFormData((prev) => ({ ...prev, status: publishStatus }))
        toast.success(publishStatus === 'published' ? 'Content published!' : 'Draft saved!')
      }
    } catch (error) {
      console.error('Failed to save content:', error)
      toast.error(error.response?.data?.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getAuthorName = () => {
    if (contentData?.author_id) {
      const author = authors.find((a) => a.id === contentData.author_id)
      return author?.name || null
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="px-6 py-4 bg-gray-50 border-b cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">{sectionLabel} Content</h3>
          {contentData?.status === 'published' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Published
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Draft
            </span>
          )}
        </div>
        {contentData?.updated_at && (
          <span className="text-sm text-gray-500">
            Updated: {formatDate(contentData.updated_at)}
            {getAuthorName() && ` by ${getAuthorName()}`}
          </span>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Author and SEO Toggle Row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <select
                name="author_id"
                value={formData.author_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowSeoFields(!showSeoFields)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showSeoFields ? 'Hide' : 'Show'} SEO Fields
            </button>
          </div>

          {/* SEO Fields - Collapsible */}
          {showSeoFields && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">SEO Settings</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                  <span className="text-gray-400 font-normal ml-2">
                    ({formData.meta_title?.length || 0}/60)
                  </span>
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleInputChange}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`${collegeName} - ${sectionLabel}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                  <span className="text-gray-400 font-normal ml-2">
                    ({formData.meta_description?.length || 0}/160)
                  </span>
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleInputChange}
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description for search engines..."
                />
              </div>
            </div>
          )}

          {/* Section Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={`${collegeName} ${sectionLabel}`}
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder={`Write ${sectionLabel.toLowerCase()} content here...`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {formData.status === 'published'
                ? 'This content is live on the website.'
                : 'This content is saved as a draft.'}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
