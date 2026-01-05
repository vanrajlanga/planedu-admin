'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, galleryAPI, uploadAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'campus', label: 'Campus' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'events', label: 'Events' },
  { value: 'library', label: 'Library' },
  { value: 'labs', label: 'Labs' },
  { value: 'sports', label: 'Sports' },
]

export default function GalleryPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [images, setImages] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingImage, setEditingImage] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    image_url: '',
    category: 'campus',
    caption: '',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  useEffect(() => {
    if (collegeId) {
      fetchGallery()
    }
  }, [collegeId, selectedCategory])

  const fetchData = async () => {
    try {
      const collegeRes = await collegeAPI.getCollege(collegeId)
      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch college:', error)
      toast.error('Failed to load college data')
    }
  }

  const fetchGallery = async () => {
    try {
      setLoading(true)
      const response = await galleryAPI.getGallery(collegeId, {
        category: selectedCategory || undefined,
      })

      if (response.data.success) {
        setImages(response.data.data.images || [])
        setCategoryStats(response.data.data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingImage(null)
    setFormData({
      image_url: '',
      category: 'campus',
      caption: '',
    })
    setSelectedFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const openEditModal = (image) => {
    setEditingImage(image)
    setFormData({
      image_url: image.image_url || '',
      category: image.category || 'campus',
      caption: image.caption || '',
    })
    setSelectedFile(null)
    setImagePreview(image.image_url || null)
    setIsModalOpen(true)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB')
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
      const response = await uploadAPI.uploadGalleryImage(selectedFile)
      if (response.data.success) {
        const imageUrl = `http://localhost:3000${response.data.data.url}`
        setFormData(prev => ({ ...prev, image_url: imageUrl }))
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

    // For new images, require a file to be selected
    if (!editingImage && !selectedFile) {
      toast.error('Please select an image')
      return
    }

    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    try {
      setSaving(true)

      let imageUrl = formData.image_url

      // Upload the file if a new file is selected
      if (selectedFile) {
        const uploadResponse = await uploadAPI.uploadGalleryImage(selectedFile)
        if (uploadResponse.data.success) {
          imageUrl = `http://localhost:3000${uploadResponse.data.data.url}`
        } else {
          toast.error('Failed to upload image')
          return
        }
      }

      const dataToSave = { ...formData, image_url: imageUrl }

      if (editingImage) {
        const response = await galleryAPI.updateImage(collegeId, editingImage.id, dataToSave)
        if (response.data.success) {
          toast.success('Image updated successfully')
          fetchGallery()
        }
      } else {
        const response = await galleryAPI.createImage(collegeId, dataToSave)
        if (response.data.success) {
          toast.success('Image added successfully')
          fetchGallery()
        }
      }

      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save image:', error)
      toast.error(error.response?.data?.message || 'Failed to save image')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (imageId) => {
    if (!confirm('Delete this image?')) return

    try {
      const response = await galleryAPI.deleteImage(collegeId, imageId)
      if (response.data.success) {
        toast.success('Image deleted successfully')
        fetchGallery()
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
      toast.error('Failed to delete image')
    }
  }

  const getCategoryLabel = (value) => {
    const cat = CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value
  }

  const getCategoryCount = (category) => {
    const stat = categoryStats.find(s => s.category === category)
    return stat ? parseInt(stat.count) : 0
  }

  if (loading && !college) {
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
        <CollegeSubNav collegeId={collegeId} collegeName={college.college_name} />

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Photo Gallery</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage campus photos for {college.college_name}
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Photo
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedCategory === ''
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({images.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = getCategoryCount(cat.value)
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedCategory === cat.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
                  <p className="mt-1 text-sm text-gray-500">Add photos to showcase the campus.</p>
                  <div className="mt-6">
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-video"
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || 'Gallery image'}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightboxImage(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setLightboxImage(image)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(image)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                          {getCategoryLabel(image.category)}
                        </span>
                        {image.caption && (
                          <p className="text-white text-xs mt-1 truncate">{image.caption}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingImage ? 'Edit Photo' : 'Add Photo'}
                  </h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 truncate">
                            {selectedFile ? selectedFile.name : 'Current image'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null)
                              setImagePreview(null)
                              setFormData(prev => ({ ...prev, image_url: '' }))
                            }}
                            className="text-sm text-red-600 hover:text-red-700 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Click to select an image</span>
                        <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Main building entrance"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingImage ? 'Update Photo' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage.image_url}
            alt={lightboxImage.caption || 'Gallery image'}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxImage.caption && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-lg">{lightboxImage.caption}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 text-white mt-2">
                {getCategoryLabel(lightboxImage.category)}
              </span>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
