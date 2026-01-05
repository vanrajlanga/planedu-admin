'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../components/AdminLayout'
import RichTextEditor from '../components/RichTextEditor'
import { courseLocationContentAPI, courseTypesAPI, uploadAPI } from '../../lib/api'

export default function LocationContentPage() {
  const [courseTypes, setCourseTypes] = useState([])
  const [selectedCourseType, setSelectedCourseType] = useState(null)
  const [locations, setLocations] = useState({ cities: [], states: [] })
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('cities')

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

      // Get current logged-in user from localStorage
      const adminUserStr = localStorage.getItem('admin_user')
      if (adminUserStr) {
        setCurrentUser(JSON.parse(adminUserStr))
      }

      const typesRes = await courseTypesAPI.getAll({ status: 'active' })
      if (typesRes.data.success) {
        setCourseTypes(typesRes.data.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseTypeSelect = async (courseType) => {
    setSelectedCourseType(courseType)
    setSelectedLocation(null)
    setLocationsLoading(true)
    setError('')

    try {
      const res = await courseLocationContentAPI.getAvailableLocations(courseType.slug)
      if (res.data.success) {
        setLocations(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
      setError('Failed to load locations')
    } finally {
      setLocationsLoading(false)
    }
  }

  const handleLocationSelect = async (location, locationType) => {
    const locationSlug = `${location.slug}-colleges`
    setSelectedLocation({ ...location, location_type: locationType, location_slug: locationSlug })
    setError('')
    setSuccess('')

    // Try to fetch existing content
    try {
      const res = await courseLocationContentAPI.getOne(selectedCourseType.slug, locationSlug)
      if (res.data.success) {
        const content = res.data.data
        setFormData({
          page_title: content.page_title || '',
          full_content: content.full_content || '',
          author_id: content.author_id || '',
          meta_title: content.meta_title || '',
          meta_description: content.meta_description || '',
          banners: content.banners || [],
          status: content.status || 'draft'
        })
      }
    } catch (err) {
      // No existing content, set defaults
      setFormData({
        page_title: `${selectedCourseType.name} Colleges in ${location.name} 2027`,
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
    if (!selectedCourseType || !selectedLocation) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        course_type: selectedCourseType.slug,
        location_type: selectedLocation.location_type,
        location_name: selectedLocation.name,
        location_slug: selectedLocation.location_slug,
        ...formData,
        author_id: currentUser?.admin_id || null, // Auto-assign logged-in user as author
        status: publishStatus || formData.status
      }

      // Check if content exists
      let exists = false
      try {
        const checkRes = await courseLocationContentAPI.getOne(selectedCourseType.slug, selectedLocation.location_slug)
        exists = checkRes.data.success
      } catch (e) {
        exists = false
      }

      if (exists) {
        await courseLocationContentAPI.update(selectedCourseType.slug, selectedLocation.location_slug, payload)
      } else {
        await courseLocationContentAPI.create(payload)
      }

      if (publishStatus) {
        setFormData({ ...formData, status: publishStatus })
      }

      setSuccess(publishStatus === 'published' ? 'Content published successfully' : 'Content saved successfully')

      // Refresh locations to update has_content status
      const res = await courseLocationContentAPI.getAvailableLocations(selectedCourseType.slug)
      if (res.data.success) {
        setLocations(res.data.data)
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
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">City/State Content</h1>
          <p className="text-gray-600 mt-1">Manage content for city and state specific course pages (e.g., /btech/mumbai-colleges)</p>
        </div>

        {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}
        {success && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-lg">{success}</div>}

        {/* Step 1: Select Course Type */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-medium mb-3">Step 1: Select Degree Type</h3>
          <div className="flex flex-wrap gap-2">
            {courseTypes.map(type => (
              <button
                key={type.course_type_id}
                onClick={() => handleCourseTypeSelect(type)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCourseType?.course_type_id === type.course_type_id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Location */}
        {selectedCourseType && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="font-medium mb-3">Step 2: Select City or State</h3>

            {locationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setActiveTab('cities')}
                    className={`px-4 py-2 -mb-px text-sm font-medium ${
                      activeTab === 'cities'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cities ({locations.cities?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('states')}
                    className={`px-4 py-2 -mb-px text-sm font-medium ${
                      activeTab === 'states'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    States ({locations.states?.length || 0})
                  </button>
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {(activeTab === 'cities' ? locations.cities : locations.states)?.map(location => (
                    <button
                      key={location.slug}
                      onClick={() => handleLocationSelect(location, activeTab === 'cities' ? 'city' : 'state')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedLocation?.slug === location.slug
                          ? 'bg-blue-600 text-white border-blue-600'
                          : location.has_content
                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className={`text-xs ${selectedLocation?.slug === location.slug ? 'text-blue-100' : 'text-gray-500'}`}>
                        {location.college_count} colleges
                        {location.has_content && <span className="ml-1">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {(activeTab === 'cities' ? locations.cities : locations.states)?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {activeTab} found with {selectedCourseType.name} colleges
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Edit Content */}
        {selectedLocation && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedCourseType.name} Colleges in {selectedLocation.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    URL: /{selectedCourseType.slug}/{selectedLocation.location_slug}
                  </p>
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

            {/* Page Title */}
            <div className="bg-white rounded-lg shadow p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={formData.page_title}
                  onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., B.Tech Colleges in Mumbai 2027"
                />
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
              <p className="text-sm text-gray-500 mb-4">Add up to 3 promo banners. Recommended size: 400x100px</p>

              {formData.banners.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  No banners added yet. Click "Add Banner" to upload.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.banners.map((banner) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        <div className="w-48 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={banner.image} alt={banner.alt || 'Banner'} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                            <input
                              type="text"
                              value={banner.alt}
                              onChange={(e) => handleBannerUpdate(banner.id, 'alt', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                              placeholder="Describe the banner"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                            <input
                              type="text"
                              value={banner.href}
                              onChange={(e) => handleBannerUpdate(banner.id, 'href', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                              placeholder="https://example.com/page"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBannerRemove(banner.id)}
                          className="text-red-500 hover:text-red-700 p-2 self-start"
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
                placeholder="Start writing your content..."
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
    </AdminLayout>
  )
}
