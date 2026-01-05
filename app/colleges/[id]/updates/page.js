'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, updatesAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import toast from 'react-hot-toast'

export default function UpdatesManagerPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [college, setCollege] = useState(null)
  const [updates, setUpdates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    update_type: 'key_update',
    source_url: '',
    event_date: '',
    expires_at: '',
    is_pinned: false,
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [collegeRes, updatesRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        updatesAPI.getUpdates(collegeId),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (updatesRes.data.success) {
        setUpdates(updatesRes.data.data?.updates || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load updates')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openCreateModal = () => {
    setEditingUpdate(null)
    setFormData({
      title: '',
      content: '',
      update_type: 'key_update',
      source_url: '',
      event_date: '',
      expires_at: '',
      is_pinned: false,
    })
    setShowModal(true)
  }

  const openEditModal = (update) => {
    setEditingUpdate(update)
    setFormData({
      title: update.title || '',
      content: update.content || '',
      update_type: update.update_type || 'key_update',
      source_url: update.source_url || '',
      event_date: update.event_date ? update.event_date.split('T')[0] : '',
      expires_at: update.expires_at ? update.expires_at.split('T')[0] : '',
      is_pinned: update.is_pinned || false,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }

    try {
      setSaving(true)
      const dataToSave = {
        ...formData,
        event_date: formData.event_date || null,
        expires_at: formData.expires_at || null,
      }

      let response
      if (editingUpdate) {
        response = await updatesAPI.updateUpdate(collegeId, editingUpdate.id, dataToSave)
      } else {
        response = await updatesAPI.createUpdate(collegeId, dataToSave)
      }

      if (response.data.success) {
        toast.success(editingUpdate ? 'Update saved!' : 'Update created!')
        setShowModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to save update:', error)
      toast.error(error.response?.data?.message || 'Failed to save update')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePin = async (update) => {
    try {
      const response = await updatesAPI.togglePin(collegeId, update.id)
      if (response.data.success) {
        toast.success(update.is_pinned ? 'Update unpinned' : 'Update pinned')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error('Failed to update pin status')
    }
  }

  const handleDelete = async (update) => {
    if (!confirm(`Are you sure you want to delete "${update.title}"?`)) {
      return
    }

    try {
      const response = await updatesAPI.deleteUpdate(collegeId, update.id)
      if (response.data.success) {
        toast.success('Update deleted')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete update:', error)
      toast.error('Failed to delete update')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Key Updates</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage important updates and announcements for this college
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Update
              </button>
            </div>

            {/* Updates List */}
            {updates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first update to keep students informed about important news.
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  Add First Update
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 ${
                      update.is_pinned ? 'border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {update.is_pinned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              PINNED
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              update.update_type === 'key_update'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {update.update_type === 'key_update' ? 'KEY UPDATE' : 'OTHER'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(update.published_at || update.created_at)}
                          </span>
                        </div>

                        <h3 className="text-base font-medium text-gray-900 mb-1">{update.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{update.content}</p>

                        {update.source_url && (
                          <a
                            href={update.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 inline-flex items-center"
                          >
                            Source
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}

                        {update.expires_at && (
                          <p className="text-xs text-orange-600 mt-2">
                            Expires: {formatDate(update.expires_at)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(update)}
                          className={`p-2 rounded-lg text-sm ${
                            update.is_pinned
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                          }`}
                          title={update.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path
                              fillRule="evenodd"
                              d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(update)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(update)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingUpdate ? 'Edit Update' : 'Add Update'}
                    </h3>
                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="input-base"
                      placeholder="e.g., JEE Advanced 2026 Registration begins"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="input-base"
                      placeholder="Detailed description of the update..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="update_type"
                        value={formData.update_type}
                        onChange={handleInputChange}
                        className="input-base"
                      >
                        <option value="key_update">Key Update</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                      <input
                        type="date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleInputChange}
                        className="input-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                    <input
                      type="url"
                      name="source_url"
                      value={formData.source_url}
                      onChange={handleInputChange}
                      className="input-base"
                      placeholder="https://example.com/news"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                    <input
                      type="date"
                      name="expires_at"
                      value={formData.expires_at}
                      onChange={handleInputChange}
                      className="input-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_pinned"
                      checked={formData.is_pinned}
                      onChange={handleInputChange}
                      id="is_pinned"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_pinned" className="ml-2 text-sm text-gray-700">
                      Pin this update (appears at the top)
                    </label>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingUpdate ? 'Save Changes' : 'Create Update'}
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
