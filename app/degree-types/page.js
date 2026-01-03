'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../components/AdminLayout'
import RichTextEditor from '../components/RichTextEditor'
import { courseTypesAPI, coursePageContentAPI, authorAPI, uploadAPI } from '../../lib/api'

// Tab Components
function CourseTypesTab() {
  const [courseTypes, setCourseTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    full_name: '',
    category: '',
    level: 'Undergraduate',
    duration_years: '',
    display_order: 0,
    status: 'active'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const levels = ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate', 'Doctoral']

  useEffect(() => {
    fetchCourseTypes()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await courseTypesAPI.getCategories()
      if (res.data.success) {
        setCategories(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchCourseTypes = async () => {
    try {
      setLoading(true)
      const res = await courseTypesAPI.getAll()
      if (res.data.success) {
        setCourseTypes(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch course types:', err)
      setError('Failed to load course types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingType) {
        await courseTypesAPI.update(editingType.course_type_id, formData)
        setSuccess('Degree type updated successfully')
      } else {
        await courseTypesAPI.create(formData)
        setSuccess('Degree type created successfully')
      }
      setShowForm(false)
      setEditingType(null)
      resetForm()
      fetchCourseTypes()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save course type')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      name: type.name || '',
      slug: type.slug || '',
      full_name: type.full_name || '',
      category: type.category || '',
      level: type.level || 'Undergraduate',
      duration_years: type.duration_years || '',
      display_order: type.display_order || 0,
      status: type.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (type) => {
    if (!confirm(`Are you sure you want to delete "${type.name}"?`)) return

    try {
      await courseTypesAPI.delete(type.course_type_id)
      setSuccess('Degree type deleted successfully')
      fetchCourseTypes()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete course type')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      full_name: '',
      category: '',
      level: 'Undergraduate',
      duration_years: '',
      display_order: 0,
      status: 'active'
    })
  }

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      {!showForm ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Degree Types ({courseTypes.length})</h2>
            <button
              onClick={() => { setShowForm(true); setEditingType(null); resetForm(); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Degree Type
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseTypes.map((type, idx) => (
                  <tr key={type.course_type_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{type.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{type.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{type.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{type.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{type.level}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{type.duration_years} yrs</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${type.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {type.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                      <button onClick={() => handleDelete(type)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">{editingType ? 'Edit Degree Type' : 'Add New Degree Type'}</h2>
            <button onClick={() => { setShowForm(false); setEditingType(null); }} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., B.Tech"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., btech"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Bachelor of Technology"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.category_id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {levels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 4"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingType(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : (editingType ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', display_order: 0, status: 'active' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await courseTypesAPI.getAllCategories()
      if (res.data.success) {
        setCategories(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingCategory) {
        await courseTypesAPI.updateCategory(editingCategory.category_id, formData)
        setSuccess('Category updated successfully')
      } else {
        await courseTypesAPI.createCategory(formData)
        setSuccess('Category created successfully')
      }
      setShowForm(false)
      setEditingCategory(null)
      setFormData({ name: '', display_order: 0, status: 'active' })
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      display_order: cat.display_order || 0,
      status: cat.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (cat) => {
    if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return

    try {
      await courseTypesAPI.deleteCategory(cat.category_id)
      setSuccess('Category deleted successfully')
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete category')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      {!showForm ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Categories ({categories.length})</h2>
            <button
              onClick={() => { setShowForm(true); setEditingCategory(null); setFormData({ name: '', display_order: 0, status: 'active' }); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Category
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((cat, idx) => (
                  <tr key={cat.category_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cat.display_order}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${cat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                      <button onClick={() => handleDelete(cat)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <button onClick={() => { setShowForm(false); setEditingCategory(null); }} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Engineering"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingCategory(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function CourseContentTab() {
  const [courseTypes, setCourseTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [existingContent, setExistingContent] = useState({})
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    page_title: '',
    full_content: '',
    author_id: '',
    meta_title: '',
    meta_description: '',
    banners: [],
    status: 'draft'
  })
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      // Fetch course types from master
      const typesRes = await courseTypesAPI.getAll({ status: 'active' })
      if (typesRes.data.success) {
        setCourseTypes(typesRes.data.data)
      }

      // Fetch existing content
      const contentRes = await coursePageContentAPI.getAll()
      if (contentRes.data.success) {
        const contentMap = {}
        contentRes.data.data.forEach(c => { contentMap[c.course_type] = c })
        setExistingContent(contentMap)
      }

      // Fetch authors
      const authorsRes = await authorAPI.getAuthors()
      if (authorsRes.data.success && Array.isArray(authorsRes.data.data)) {
        setAuthors(authorsRes.data.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = async (type) => {
    setSelectedType(type)
    setError('')
    setSuccess('')

    // Check if content exists - use slug for consistent lookup
    const contentKey = type.slug || type.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (existingContent[contentKey]) {
      const c = existingContent[contentKey]
      setFormData({
        page_title: c.page_title || '',
        full_content: c.full_content || '',
        author_id: c.author_id || '',
        meta_title: c.meta_title || '',
        meta_description: c.meta_description || '',
        banners: c.banners || [],
        status: c.status || 'draft'
      })
    } else {
      // Default values for new content
      setFormData({
        page_title: `${type.name} Colleges in India 2026`,
        full_content: '',
        author_id: '',
        meta_title: '',
        meta_description: '',
        banners: [],
        status: 'draft'
      })
    }
  }

  const handleSave = async (publishStatus = null) => {
    if (!selectedType) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Use slug for consistent storage
      const contentKey = selectedType.slug || selectedType.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const payload = {
        course_type: contentKey,
        ...formData,
        status: publishStatus || formData.status
      }

      if (existingContent[contentKey]) {
        await coursePageContentAPI.update(contentKey, payload)
      } else {
        await coursePageContentAPI.create(payload)
      }

      setSuccess(publishStatus === 'published' ? 'Content published successfully' : 'Content saved successfully')
      if (publishStatus) {
        setFormData({ ...formData, status: publishStatus })
      }

      // Refresh existing content
      const contentRes = await coursePageContentAPI.getAll()
      if (contentRes.data.success) {
        const contentMap = {}
        contentRes.data.data.forEach(c => { contentMap[c.course_type] = c })
        setExistingContent(contentMap)
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (html) => {
    setFormData({ ...formData, full_content: html })
  }

  // Banner management functions
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    setError('')

    try {
      const res = await uploadAPI.uploadBannerImage(file)
      if (res.data.success) {
        const newBanner = {
          id: Date.now(),
          image: res.data.data.url,
          alt: '',
          href: ''
        }
        setFormData({
          ...formData,
          banners: [...formData.banners, newBanner]
        })
      }
    } catch (err) {
      setError('Failed to upload banner image')
      console.error('Upload error:', err)
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ''
      }
    }
  }

  const handleBannerUpdate = (bannerId, field, value) => {
    setFormData({
      ...formData,
      banners: formData.banners.map(b =>
        b.id === bannerId ? { ...b, [field]: value } : b
      )
    })
  }

  const handleBannerRemove = (bannerId) => {
    setFormData({
      ...formData,
      banners: formData.banners.filter(b => b.id !== bannerId)
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

      {/* Course Type Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3">Select Degree Type</h3>
        <div className="flex flex-wrap gap-2">
          {courseTypes.map(type => {
            const contentKey = type.slug || type.name.toLowerCase().replace(/[^a-z0-9]/g, '')
            return (
              <button
                key={type.course_type_id}
                onClick={() => handleTypeSelect(type)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  selectedType?.course_type_id === type.course_type_id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : existingContent[contentKey]
                      ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {type.name}
                {existingContent[contentKey] && <span className="text-xs">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Form */}
      {selectedType && (
        <div className="space-y-6">
          {/* Header with Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{selectedType.name} - {selectedType.full_name}</h3>
                <p className="text-sm text-gray-500">{selectedType.category} | {selectedType.level} | {selectedType.duration_years} years</p>
              </div>
              <div className="flex items-center gap-2">
                {formData.status === 'published' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Draft</span>
                )}
              </div>
            </div>
          </div>

          {/* Page Title & Author */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={formData.page_title}
                  onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., B.Tech Colleges in India 2026"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <select
                  value={formData.author_id}
                  onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Author</option>
                  {authors.map(author => (
                    <option key={author.author_id} value={author.author_id}>{author.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">SEO Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                  <span className="text-gray-400 font-normal ml-2">({formData.meta_title?.length || 0}/60)</span>
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO title for the page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                  <span className="text-gray-400 font-normal ml-2">({formData.meta_description?.length || 0}/160)</span>
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO description for the page"
                />
              </div>
            </div>
          </div>

          {/* Banner Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Promo Banners</h4>
              <div>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner || formData.banners.length >= 3}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingBanner ? 'Uploading...' : '+ Add Banner'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">Add up to 3 promo banners that appear on the listing page. Recommended size: 400x100px</p>

            {formData.banners.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                No banners added yet. Click "Add Banner" to upload.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.banners.map((banner, index) => (
                  <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Banner Preview */}
                      <div className="w-48 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={banner.image}
                          alt={banner.alt || 'Banner preview'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Banner Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={banner.alt}
                            onChange={(e) => handleBannerUpdate(banner.id, 'alt', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe the banner for accessibility"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                          <input
                            type="text"
                            value={banner.href}
                            onChange={(e) => handleBannerUpdate(banner.id, 'href', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://example.com/page"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleBannerRemove(banner.id)}
                        className="text-red-500 hover:text-red-700 p-2 self-start"
                        title="Remove banner"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Content</label>
            <RichTextEditor
              content={formData.full_content}
              onChange={handleContentChange}
              placeholder="Start writing your content... Add headings, lists, tables, images and more..."
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {formData.status === 'published'
                  ? 'This content is live on the website.'
                  : 'This content is saved as a draft.'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Page Component
export default function CoursesMasterPage() {
  const [activeTab, setActiveTab] = useState('types')

  const tabs = [
    { id: 'types', label: 'Degree Types', icon: '📋' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'content', label: 'Degree Content', icon: '📝' }
  ]

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Degree Types</h1>
          <p className="text-gray-600 mt-1">Manage degree types and their content from a single place</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'types' && <CourseTypesTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'content' && <CourseContentTab />}
      </div>
    </AdminLayout>
  )
}
