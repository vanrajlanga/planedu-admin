'use client'

import { useState, useEffect, useRef } from 'react'
import { authorAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: 'Content Writer',
    bio: '',
    is_verified: false,
    status: 'active'
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchAuthors()
  }, [search, status])

  const fetchAuthors = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 25, search, status }
      const response = await authorAPI.getAuthors(params)
      if (response.data.success) {
        setAuthors(response.data.data.authors)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      toast.error('Failed to load authors')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (author = null) => {
    if (author) {
      setEditingAuthor(author)
      setFormData({
        name: author.name || '',
        email: author.email || '',
        designation: author.designation || 'Content Writer',
        bio: author.bio || '',
        is_verified: author.is_verified || false,
        status: author.status || 'active'
      })
      setImagePreview(author.profile_image_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${author.profile_image_url}` : null)
    } else {
      setEditingAuthor(null)
      setFormData({
        name: '',
        email: '',
        designation: 'Content Writer',
        bio: '',
        is_verified: false,
        status: 'active'
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAuthor(null)
    setFormData({
      name: '',
      email: '',
      designation: 'Content Writer',
      bio: '',
      is_verified: false,
      status: 'active'
    })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    try {
      setSaving(true)
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('designation', formData.designation)
      submitData.append('bio', formData.bio)
      submitData.append('is_verified', formData.is_verified)
      submitData.append('status', formData.status)

      if (imageFile) {
        submitData.append('image', imageFile)
      }

      if (editingAuthor) {
        await authorAPI.updateAuthor(editingAuthor.id, submitData)
        toast.success('Author updated successfully')
      } else {
        await authorAPI.createAuthor(submitData)
        toast.success('Author created successfully')
      }
      handleCloseModal()
      fetchAuthors()
    } catch (error) {
      console.error('Failed to save author:', error)
      toast.error(error.response?.data?.message || 'Failed to save author')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this author?')) {
      return
    }

    try {
      await authorAPI.deleteAuthor(id)
      toast.success('Author deleted successfully')
      fetchAuthors()
    } catch (error) {
      console.error('Failed to delete author:', error)
      toast.error('Failed to delete author')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
  }

  const getImageUrl = (path) => {
    if (!path) return null
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
    return `${baseUrl}${path}`
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Content Authors</h1>
          <p className="text-gray-600 mt-1">Manage content writers and authors</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name, email, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Author
            </button>
          </div>
        </div>

        {/* Authors Grid */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading authors...</p>
            </div>
          ) : authors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No authors found. Create your first author to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {authors.map((author) => (
                <div key={author.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {author.profile_image_url ? (
                        <img
                          src={getImageUrl(author.profile_image_url)}
                          alt={author.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl text-gray-500">{author.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate flex items-center gap-2">
                        {author.name}
                        {author.is_verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{author.designation}</p>
                      <p className="text-xs text-gray-400 truncate">{author.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          author.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {author.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(author)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(author.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-center gap-2">
              <button
                onClick={() => fetchAuthors(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchAuthors(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingAuthor ? 'Edit Author' : 'Add New Author'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Profile Image */}
                <div className="mb-4 flex flex-col items-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="mt-2 text-sm text-gray-500">Click to upload photo</p>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Designation */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Content Writer">Content Writer</option>
                    <option value="Senior Content Specialist">Senior Content Specialist</option>
                    <option value="Content Manager">Content Manager</option>
                    <option value="Editor">Editor</option>
                    <option value="Subject Matter Expert">Subject Matter Expert</option>
                  </select>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Short bio..."
                  />
                </div>

                {/* Status and Verified */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="is_verified"
                      checked={formData.is_verified}
                      onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="is_verified" className="ml-2 text-sm text-gray-700">
                      Verified Author
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingAuthor ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
