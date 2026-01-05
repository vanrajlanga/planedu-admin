'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { coursePageContentAPI } from '../../lib/api'

export default function CoursePageContentPage() {
  const [courseTypes, setCourseTypes] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedCourseType, setSelectedCourseType] = useState('')
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    page_title: '',
    intro_text: '',
    key_points: [''],
    table_of_contents: [{ id: '', title: '' }],
    highlights_data: {
      total_colleges: '',
      govt_colleges: '',
      private_colleges: '',
      top_college: '',
      top_specializations: [''],
      fee_range: '',
      median_package: '',
      top_exams: [''],
    },
    author_id: '',
    meta_title: '',
    meta_description: '',
    status: 'draft',
  })

  useEffect(() => {
    fetchCourseTypes()
    // Get current logged-in user from localStorage
    const adminUserStr = localStorage.getItem('admin_user')
    if (adminUserStr) {
      setCurrentUser(JSON.parse(adminUserStr))
    }
  }, [])

  useEffect(() => {
    if (selectedCourseType) {
      fetchContent(selectedCourseType)
    }
  }, [selectedCourseType])

  const fetchCourseTypes = async () => {
    try {
      const res = await coursePageContentAPI.getCourseTypes()
      if (res.data.success) {
        setCourseTypes(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch course types:', err)
    } finally {
      setLoading(false)
    }
  }


  const fetchContent = async (courseType) => {
    try {
      setLoading(true)
      const res = await coursePageContentAPI.getByType(courseType)
      if (res.data.success) {
        const data = res.data.data
        setContent(data)
        setFormData({
          page_title: data.page_title || '',
          intro_text: data.intro_text || '',
          key_points: data.key_points?.length > 0 ? data.key_points : [''],
          table_of_contents: data.table_of_contents?.length > 0 ? data.table_of_contents : [{ id: '', title: '' }],
          highlights_data: {
            total_colleges: data.highlights_data?.total_colleges || '',
            govt_colleges: data.highlights_data?.govt_colleges || '',
            private_colleges: data.highlights_data?.private_colleges || '',
            top_college: data.highlights_data?.top_college || '',
            top_specializations: data.highlights_data?.top_specializations?.length > 0 ? data.highlights_data.top_specializations : [''],
            fee_range: data.highlights_data?.fee_range || '',
            median_package: data.highlights_data?.median_package || '',
            top_exams: data.highlights_data?.top_exams?.length > 0 ? data.highlights_data.top_exams : [''],
          },
          author_id: data.author_id || '',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          status: data.status || 'draft',
        })
      }
    } catch (err) {
      setError('Failed to load content')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCourseType) {
      setError('Please select a course type')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Clean up form data
      const cleanedData = {
        ...formData,
        key_points: formData.key_points.filter(p => p.trim() !== ''),
        table_of_contents: formData.table_of_contents.filter(t => t.title.trim() !== ''),
        highlights_data: {
          ...formData.highlights_data,
          total_colleges: formData.highlights_data.total_colleges ? parseInt(formData.highlights_data.total_colleges) : null,
          govt_colleges: formData.highlights_data.govt_colleges ? parseInt(formData.highlights_data.govt_colleges) : null,
          private_colleges: formData.highlights_data.private_colleges ? parseInt(formData.highlights_data.private_colleges) : null,
          top_specializations: formData.highlights_data.top_specializations.filter(s => s.trim() !== ''),
          top_exams: formData.highlights_data.top_exams.filter(e => e.trim() !== ''),
        },
        author_id: currentUser?.admin_id || null, // Auto-assign logged-in user as author
      }

      const res = await coursePageContentAPI.update(selectedCourseType, cleanedData)
      if (res.data.success) {
        setSuccess('Content saved successfully')
        setTimeout(() => setSuccess(''), 3000)
        fetchCourseTypes() // Refresh to update has_content status
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save content')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const addKeyPoint = () => {
    setFormData(prev => ({
      ...prev,
      key_points: [...prev.key_points, '']
    }))
  }

  const removeKeyPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index)
    }))
  }

  const updateKeyPoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.map((p, i) => i === index ? value : p)
    }))
  }

  const addTocItem = () => {
    setFormData(prev => ({
      ...prev,
      table_of_contents: [...prev.table_of_contents, { id: '', title: '' }]
    }))
  }

  const removeTocItem = (index) => {
    setFormData(prev => ({
      ...prev,
      table_of_contents: prev.table_of_contents.filter((_, i) => i !== index)
    }))
  }

  const updateTocItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      table_of_contents: prev.table_of_contents.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      highlights_data: {
        ...prev.highlights_data,
        [field]: [...prev.highlights_data[field], '']
      }
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      highlights_data: {
        ...prev.highlights_data,
        [field]: prev.highlights_data[field].filter((_, i) => i !== index)
      }
    }))
  }

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      highlights_data: {
        ...prev.highlights_data,
        [field]: prev.highlights_data[field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Course Page Content</h1>
          <p className="text-slate-600 mt-1">
            Manage blog/article content for course listing pages (e.g., BTech Colleges in India)
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Course Type Selector */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Course Type
          </label>
          <div className="flex flex-wrap gap-2">
            {courseTypes.map(ct => (
              <button
                key={ct.course_type}
                onClick={() => setSelectedCourseType(ct.course_type.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCourseType === ct.course_type.toLowerCase()
                    ? 'bg-primary-600 text-white'
                    : ct.has_content
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {ct.display_name || ct.course_type}
                {ct.has_content && (
                  <span className="ml-2 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Green = Has content | Click to edit
          </p>
        </div>

        {/* Content Form */}
        {selectedCourseType && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={formData.page_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, page_title: e.target.value }))}
                    placeholder="e.g., BTech Colleges in India 2026: Fees, Admissions, Placements"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Intro Text
                  </label>
                  <textarea
                    value={formData.intro_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, intro_text: e.target.value }))}
                    rows={4}
                    placeholder="Introduction paragraph about the course..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Key Points (Bullet Points)</h2>
                <button
                  onClick={addKeyPoint}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Point
                </button>
              </div>

              <div className="space-y-2">
                {formData.key_points.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      placeholder={`Key point ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {formData.key_points.length > 1 && (
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Table of Contents</h2>
                <button
                  onClick={addTocItem}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Section
                </button>
              </div>

              <div className="space-y-2">
                {formData.table_of_contents.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.id}
                      onChange={(e) => updateTocItem(index, 'id', e.target.value)}
                      placeholder="Section ID (e.g., highlights)"
                      className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateTocItem(index, 'title', e.target.value)}
                      placeholder="Section Title"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {formData.table_of_contents.length > 1 && (
                      <button
                        onClick={() => removeTocItem(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights Data */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Highlights Statistics</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Colleges
                  </label>
                  <input
                    type="number"
                    value={formData.highlights_data.total_colleges}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, total_colleges: e.target.value }
                    }))}
                    placeholder="e.g., 4500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Government Colleges
                  </label>
                  <input
                    type="number"
                    value={formData.highlights_data.govt_colleges}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, govt_colleges: e.target.value }
                    }))}
                    placeholder="e.g., 700"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Private Colleges
                  </label>
                  <input
                    type="number"
                    value={formData.highlights_data.private_colleges}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, private_colleges: e.target.value }
                    }))}
                    placeholder="e.g., 3800"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Top College
                  </label>
                  <input
                    type="text"
                    value={formData.highlights_data.top_college}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, top_college: e.target.value }
                    }))}
                    placeholder="e.g., IIT Bombay"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fee Range
                  </label>
                  <input
                    type="text"
                    value={formData.highlights_data.fee_range}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, fee_range: e.target.value }
                    }))}
                    placeholder="e.g., INR 50,000 - INR 25 Lakh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Median Package
                  </label>
                  <input
                    type="text"
                    value={formData.highlights_data.median_package}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      highlights_data: { ...prev.highlights_data, median_package: e.target.value }
                    }))}
                    placeholder="e.g., INR 8-20 LPA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Top Specializations */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Top Specializations
                  </label>
                  <button
                    onClick={() => addArrayItem('top_specializations')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.highlights_data.top_specializations.map((spec, index) => (
                    <div key={index} className="flex gap-1">
                      <input
                        type="text"
                        value={spec}
                        onChange={(e) => updateArrayItem('top_specializations', index, e.target.value)}
                        placeholder="Specialization"
                        className="w-40 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {formData.highlights_data.top_specializations.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('top_specializations', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Exams */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Accepted Exams
                  </label>
                  <button
                    onClick={() => addArrayItem('top_exams')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.highlights_data.top_exams.map((exam, index) => (
                    <div key={index} className="flex gap-1">
                      <input
                        type="text"
                        value={exam}
                        onChange={(e) => updateArrayItem('top_exams', index, e.target.value)}
                        placeholder="Exam name"
                        className="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {formData.highlights_data.top_exams.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('top_exams', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">SEO Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title for the page"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    rows={2}
                    placeholder="SEO description for the page"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedCourseType('')}
                className="px-6 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedCourseType && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Course Type</h3>
            <p className="text-slate-600">
              Choose a course type above to create or edit its listing page content
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
