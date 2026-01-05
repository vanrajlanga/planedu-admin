'use client'

import { useState, useEffect } from 'react'
import { bannerAPI, uploadAPI, getBackendBaseUrl } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

export default function BannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [stats, setStats] = useState({})

  const [search, setSearch] = useState('')
  const [placement, setPlacement] = useState('')
  const [pageType, setPageType] = useState('')
  const [isActive, setIsActive] = useState('')
  const [placements, setPlacements] = useState([])
  const [pageTypes, setPageTypes] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    placement: '',
    page_type: '',
    target_audience: '',
    priority: 0,
    valid_from: '',
    valid_to: '',
    is_active: true
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchBanners()
    fetchPlacements()
    fetchPageTypes()
    fetchStats()
  }, [search, placement, pageType, isActive])

  const fetchBanners = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 25, search, placement, page_type: pageType, is_active: isActive }
      const response = await bannerAPI.getBanners(params)
      if (response.data.success) {
        setBanners(response.data.data.banners)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlacements = async () => {
    try {
      const response = await bannerAPI.getPlacements()
      if (response.data.success) setPlacements(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch placements:', error)
    }
  }

  const fetchPageTypes = async () => {
    try {
      const response = await bannerAPI.getPageTypes()
      if (response.data.success) setPageTypes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch page types:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await bannerAPI.getStats()
      if (response.data.success) setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        placement: banner.placement || '',
        page_type: banner.page_type || '',
        target_audience: banner.target_audience || '',
        priority: banner.priority || 0,
        valid_from: banner.valid_from ? banner.valid_from.split('T')[0] : '',
        valid_to: banner.valid_to ? banner.valid_to.split('T')[0] : '',
        is_active: banner.is_active
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        placement: '',
        page_type: '',
        target_audience: '',
        priority: 0,
        valid_from: '',
        valid_to: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBanner(null)
    setSelectedFile(null)
    setImagePreview('')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleUploadImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    try {
      setUploading(true)
      const response = await uploadAPI.uploadBannerImage(selectedFile)
      if (response.data.success) {
        const imageUrl = `${getBackendBaseUrl()}${response.data.data.url}`
        setFormData({...formData, image_url: imageUrl})
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.image_url) {
      toast.error('Title and image URL are required')
      return
    }

    try {
      if (editingBanner) {
        await bannerAPI.updateBanner(editingBanner.id, formData)
        toast.success('Banner updated successfully')
      } else {
        await bannerAPI.createBanner(formData)
        toast.success('Banner created successfully')
      }
      handleCloseModal()
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Failed to save banner:', error)
      toast.error(error.response?.data?.message || 'Failed to save banner')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      await bannerAPI.deleteBanner(id)
      toast.success('Banner deleted successfully')
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setPlacement('')
    setPageType('')
    setIsActive('')
  }

  return (
    <AdminLayout>
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banner Management</h1>
        <p className="text-gray-600 mt-1">Manage promotional banners and advertisements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Banners</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Currently Showing</p>
          <p className="text-2xl font-bold text-green-600">{stats.currently_showing || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Clicks</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total_clicks || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-2xl font-bold text-purple-600">{stats.total_views || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search banners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Placements</option>
            {placements.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Page Types</option>
            {pageTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
          </select>
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Banner
          </button>
        </div>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No banners found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E' }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{banner.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {banner.placement && (
                    <p className="text-sm text-gray-600 mb-1">Placement: {banner.placement}</p>
                  )}
                  {banner.page_type && (
                    <p className="text-sm text-gray-600 mb-1">Page: {banner.page_type}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>Priority: {banner.priority}</span>
                    <span>Clicks: {banner.click_count || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => fetchBanners(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchBanners(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Banner Image <span className="text-red-500">*</span></label>

                    {/* Image Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label htmlFor="banner-image-upload" className="cursor-pointer">
                        {imagePreview || formData.image_url ? (
                          <div className="space-y-2">
                            <img
                              src={imagePreview || formData.image_url}
                              alt="Banner preview"
                              className="max-h-48 mx-auto rounded"
                            />
                            <p className="text-sm text-gray-600">Click to change image</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">Click to upload banner image</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        )}
                      </label>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleUploadImage}
                          disabled={uploading}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </button>
                      )}
                    </div>

                    {/* Manual URL Input (Optional) */}
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1">Or enter image URL manually:</label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link URL</label>
                    <input type="url" value={formData.link_url} onChange={(e) => setFormData({...formData, link_url: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Placement</label>
                      <input type="text" value={formData.placement} onChange={(e) => setFormData({...formData, placement: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="header, sidebar, footer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Page Type</label>
                      <input type="text" value={formData.page_type} onChange={(e) => setFormData({...formData, page_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="home, college, course" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <input type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Valid From</label>
                      <input type="date" value={formData.valid_from} onChange={(e) => setFormData({...formData, valid_from: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Valid To</label>
                      <input type="date" value={formData.valid_to} onChange={(e) => setFormData({...formData, valid_to: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                    <label htmlFor="is_active" className="ml-2 text-sm">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} className="px-6 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">{editingBanner ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  )
}
