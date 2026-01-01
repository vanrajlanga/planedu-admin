'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, contentAPI, authorAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import RichTextEditor from '@/app/components/RichTextEditor'
import toast from 'react-hot-toast'

const SECTION_TYPES = [
  { value: 'overview', label: 'Overview' },
  { value: 'courses', label: 'Courses & Fees' },
  { value: 'admission', label: 'Admission' },
  { value: 'cutoff', label: 'Cutoff' },
  { value: 'placement', label: 'Placements' },
  { value: 'ranking', label: 'Rankings' },
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'hostel', label: 'Hostel & Campus' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'gallery', label: 'Gallery' },
]

export default function ContentEditorPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [authors, setAuthors] = useState([])
  const [selectedSection, setSelectedSection] = useState('overview')
  const [contentData, setContentData] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_id: '',
    meta_title: '',
    meta_description: '',
    status: 'draft',
  })

  useEffect(() => {
    fetchInitialData()
  }, [collegeId])

  useEffect(() => {
    loadSectionContent(selectedSection)
  }, [selectedSection, contentData])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [collegeRes, authorsRes, contentRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        authorAPI.getAuthorsList(),
        contentAPI.getAllContent(collegeId),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (authorsRes.data.success) {
        setAuthors(authorsRes.data.data || [])
      }

      if (contentRes.data.success) {
        const contentMap = {}
        const sections = contentRes.data.data?.sections || []
        sections.forEach((item) => {
          contentMap[item.section_type] = item
        })
        setContentData(contentMap)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadSectionContent = (section) => {
    const sectionContent = contentData[section]
    if (sectionContent) {
      setFormData({
        title: sectionContent.title || '',
        content: sectionContent.content || '',
        author_id: sectionContent.author_id || '',
        meta_title: sectionContent.meta_title || '',
        meta_description: sectionContent.meta_description || '',
        status: sectionContent.status || 'draft',
      })
    } else {
      setFormData({
        title: '',
        content: '',
        author_id: '',
        meta_title: '',
        meta_description: '',
        status: 'draft',
      })
    }
  }

  const handleSave = async (publishStatus) => {
    try {
      setSaving(true)
      const dataToSave = {
        ...formData,
        status: publishStatus,
      }

      const response = await contentAPI.updateSection(collegeId, selectedSection, dataToSave)

      if (response.data.success) {
        // Update local content data
        setContentData((prev) => ({
          ...prev,
          [selectedSection]: {
            ...prev[selectedSection],
            ...dataToSave,
            updated_at: new Date().toISOString(),
          },
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (html) => {
    setFormData((prev) => ({ ...prev, content: html }))
  }

  const getLastUpdated = () => {
    const section = contentData[selectedSection]
    if (section?.updated_at) {
      return new Date(section.updated_at).toLocaleString()
    }
    return null
  }

  const getAuthorName = () => {
    const authorId = contentData[selectedSection]?.author_id
    if (authorId) {
      const author = authors.find((a) => a.id === authorId)
      return author?.name || 'Unknown'
    }
    return null
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b px-6 py-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!college) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">College not found</p>
            <a href="/colleges" className="btn-primary">
              Back to Colleges
            </a>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Sub Navigation */}
        <CollegeSubNav collegeId={collegeId} collegeName={college.college_name} />

        {/* Content Area */}
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            {/* Section Selector and Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="input-base min-w-[200px]"
                    >
                      {SECTION_TYPES.map((section) => (
                        <option key={section.value} value={section.value}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <select
                      name="author_id"
                      value={formData.author_id}
                      onChange={handleInputChange}
                      className="input-base min-w-[200px]"
                    >
                      <option value="">Select Author</option>
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {contentData[selectedSection]?.status === 'published' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Last Updated Info */}
              {getLastUpdated() && (
                <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                  Last updated: {getLastUpdated()}
                  {getAuthorName() && <span className="ml-2">by {getAuthorName()}</span>}
                </div>
              )}
            </div>

            {/* SEO Fields */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              <div className="space-y-4">
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
                    className="input-base"
                    placeholder={`${college.college_name} - ${SECTION_TYPES.find((s) => s.value === selectedSection)?.label}`}
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
                    className="input-base"
                    placeholder="Brief description for search engines..."
                  />
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-base"
                  placeholder={`${college.college_name} ${SECTION_TYPES.find((s) => s.value === selectedSection)?.label}`}
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Content</label>
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                placeholder="Start writing your content..."
              />
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {formData.status === 'published'
                    ? 'This content is live on the website.'
                    : 'This content is saved as a draft.'}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`/colleges/${collegeId}/preview?section=${selectedSection}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </a>
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
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
