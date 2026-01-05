'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collegeAPI, getBackendBaseUrl } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

// Helper to get full image URL (handles both relative paths and full URLs)
const getImageUrl = (url) => {
  if (!url) return ''
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Replace localhost with backend URL for old data
    if (url.includes('localhost:3000')) {
      return url.replace('http://localhost:3000', getBackendBaseUrl())
    }
    return url
  }
  // Relative path - prepend backend URL
  return `${getBackendBaseUrl()}${url}`
}

export default function CollegesPage() {
  const router = useRouter()
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedColleges, setSelectedColleges] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    college_types: [],
    ownership_types: [],
    statuses: []
  })

  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0
  })

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    college_type: '',
    ownership: '',
    state: '',
    status: '',
    is_featured: '',
    is_verified: ''
  })

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingCollege, setEditingCollege] = useState(null)
  const [formData, setFormData] = useState({
    college_name: '',
    short_name: '',
    established_year: '',
    college_type: 'University',
    ownership: 'Private',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    address: '',
    latitude: '',
    longitude: '',
    website_url: '',
    phone: '',
    email: '',
    description: '',
    logo_url: '',
    is_featured: false,
    is_verified: false,
    status: 'pending'
  })

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions()
  }, [])

  // Fetch colleges when filters or page changes
  useEffect(() => {
    fetchColleges()
  }, [pagination.current_page, filters])

  const fetchFilterOptions = async () => {
    try {
      const response = await collegeAPI.getFilterOptions()
      if (response.data.success) {
        setFilterOptions(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
    }
  }

  const fetchColleges = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current_page,
        limit: pagination.per_page,
        ...filters
      }

      const response = await collegeAPI.getColleges(params)

      if (response.data.success) {
        setColleges(response.data.data.colleges)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error)
      toast.error('Failed to load colleges')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (college = null) => {
    if (college) {
      setEditingCollege(college)
      setFormData({
        college_name: college.college_name || '',
        short_name: college.short_name || '',
        established_year: college.established_year || '',
        college_type: college.college_type || 'University',
        ownership: college.ownership || 'Private',
        country: college.country || 'India',
        state: college.state || '',
        city: college.city || '',
        pincode: college.pincode || '',
        address: college.address || '',
        latitude: college.latitude || '',
        longitude: college.longitude || '',
        website_url: college.website_url || '',
        phone: college.phone || '',
        email: college.email || '',
        description: college.description || '',
        logo_url: college.logo_url || '',
        is_featured: college.is_featured || false,
        is_verified: college.is_verified || false,
        status: college.status || 'pending'
      })
    } else {
      setEditingCollege(null)
      setFormData({
        college_name: '',
        short_name: '',
        established_year: '',
        college_type: 'University',
        ownership: 'Private',
        country: 'India',
        state: '',
        city: '',
        pincode: '',
        address: '',
        latitude: '',
        longitude: '',
        website_url: '',
        phone: '',
        email: '',
        description: '',
        logo_url: '',
        is_featured: false,
        is_verified: false,
        status: 'pending'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCollege(null)
    setFormData({
      college_name: '',
      short_name: '',
      established_year: '',
      college_type: 'University',
      ownership: 'Private',
      country: 'India',
      state: '',
      city: '',
      pincode: '',
      address: '',
      latitude: '',
      longitude: '',
      website_url: '',
      phone: '',
      email: '',
      description: '',
      logo_url: '',
      is_featured: false,
      is_verified: false,
      status: 'pending'
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.college_name || !formData.state || !formData.city) {
      toast.error('College name, state, and city are required')
      return
    }

    try {
      // Prepare data - remove empty strings
      const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value
        }
        return acc
      }, {})

      if (editingCollege) {
        await collegeAPI.updateCollege(editingCollege.college_id, dataToSubmit)
        toast.success('College updated successfully!')
      } else {
        await collegeAPI.createCollege(dataToSubmit)
        toast.success('College created successfully!')
      }

      handleCloseModal()
      fetchColleges()
    } catch (error) {
      console.error('Failed to save college:', error)
      toast.error(error.response?.data?.message || 'Failed to save college')
    }
  }

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value })
    setPagination({ ...pagination, current_page: 1 })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, current_page: 1 })
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      college_type: '',
      ownership: '',
      state: '',
      status: '',
      is_featured: '',
      is_verified: ''
    })
    setPagination({ ...pagination, current_page: 1 })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedColleges(colleges.map(c => c.college_id))
    } else {
      setSelectedColleges([])
    }
  }

  const handleSelectCollege = (collegeId) => {
    if (selectedColleges.includes(collegeId)) {
      setSelectedColleges(selectedColleges.filter(id => id !== collegeId))
    } else {
      setSelectedColleges([...selectedColleges, collegeId])
    }
  }

  const handleStatusChange = async (collegeId, newStatus) => {
    try {
      const response = await collegeAPI.updateCollegeStatus(collegeId, newStatus)
      if (response.data.success) {
        fetchColleges()
        toast.success('College status updated successfully')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update college status')
    }
  }

  const handleBulkStatusUpdate = async (status) => {
    if (selectedColleges.length === 0) {
      toast.error('Please select colleges first')
      return
    }

    if (!confirm(`Update ${selectedColleges.length} college(s) to ${status}?`)) {
      return
    }

    try {
      const response = await collegeAPI.bulkUpdateStatus(selectedColleges, status)
      if (response.data.success) {
        setSelectedColleges([])
        fetchColleges()
        toast.success(`${response.data.data.updated_count} college(s) updated successfully`)
      }
    } catch (error) {
      console.error('Failed to bulk update:', error)
      toast.error('Failed to update colleges')
    }
  }

  const handleDeleteCollege = async (collegeId, collegeName) => {
    if (!confirm(`Are you sure you want to delete "${collegeName}"?`)) {
      return
    }

    try {
      const response = await collegeAPI.deleteCollege(collegeId)
      if (response.data.success) {
        fetchColleges()
        toast.success('College deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete college:', error)
      toast.error('Failed to delete college')
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success'
      case 'inactive':
        return 'badge-error'
      case 'pending':
        return 'badge-warning'
      default:
        return 'badge-neutral'
    }
  }

  const hasActiveFilters = filters.search || filters.college_type || filters.ownership ||
                          filters.state || filters.status || filters.is_featured || filters.is_verified

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">College Management</h1>
            <p className="text-slate-600 mt-1">Manage colleges, institutions, and universities</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
          >
            + Add College
          </button>
        </div>

        {/* Filters Card */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name, city, or state..."
                value={filters.search}
                onChange={handleSearch}
                className="input-base"
              />
            </div>

            {/* College Type */}
            <div>
              <select
                value={filters.college_type}
                onChange={(e) => handleFilterChange('college_type', e.target.value)}
                className="input-base"
              >
                <option value="">All Types</option>
                {filterOptions.college_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Ownership */}
            <div>
              <select
                value={filters.ownership}
                onChange={(e) => handleFilterChange('ownership', e.target.value)}
                className="input-base"
              >
                <option value="">All Ownership</option>
                {filterOptions.ownership_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="input-base"
              >
                <option value="">All States</option>
                {filterOptions.states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-base"
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Featured */}
            <div>
              <select
                value={filters.is_featured}
                onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                className="input-base"
              >
                <option value="">Featured: All</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>

            {/* Verified */}
            <div>
              <select
                value={filters.is_verified}
                onChange={(e) => handleFilterChange('is_verified', e.target.value)}
                className="input-base"
              >
                <option value="">Verified: All</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>

          {/* Active Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Clear all filters
              </button>
            )}

            {selectedColleges.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-600">
                  {selectedColleges.length} selected
                </span>
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('inactive')}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  Deactivate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Colleges Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-slate-600">Loading colleges...</p>
            </div>
          ) : colleges.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No colleges found</h3>
              <p className="text-slate-600 mb-6">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by adding your first college'}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => handleOpenModal()}
                  className="btn-primary"
                >
                  + Add College
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedColleges.length === colleges.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {colleges.map((college) => (
                      <tr key={college.college_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedColleges.includes(college.college_id)}
                            onChange={() => handleSelectCollege(college.college_id)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {college.logo_url ? (
                              <img
                                src={getImageUrl(college.logo_url)}
                                alt={college.college_name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">
                                  {college.college_name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/colleges/${college.college_id}`}
                                className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                              >
                                {college.college_name}
                              </Link>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                {college.short_name && <span>{college.short_name}</span>}
                                {college.is_featured && (
                                  <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                                    ⭐ Featured
                                  </span>
                                )}
                                {college.is_verified && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{college.city}</div>
                          <div className="text-xs text-slate-500">{college.state}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{college.college_type}</div>
                          <div className="text-xs text-slate-500">{college.ownership}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold text-slate-900">
                              {college.avg_rating ? parseFloat(college.avg_rating).toFixed(1) : 'N/A'}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({college.total_reviews || 0})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={college.status}
                            onChange={(e) => handleStatusChange(college.college_id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${
                              college.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                              college.status === 'inactive' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/colleges/${college.college_id}`}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteCollege(college.college_id, college.college_name)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{' '}
                  {pagination.total_items} colleges
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: 1 })}
                    disabled={!pagination.has_prev}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                    disabled={!pagination.has_prev}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-1.5 text-sm font-medium">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                    disabled={!pagination.has_next}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.total_pages })}
                    disabled={!pagination.has_next}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {editingCollege ? 'Edit College' : 'Add New College'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            College Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="college_name"
                            value={formData.college_name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Indian Institute of Technology Delhi"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Short Name
                          </label>
                          <input
                            type="text"
                            name="short_name"
                            value={formData.short_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., IIT Delhi"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Established Year
                          </label>
                          <input
                            type="number"
                            name="established_year"
                            value={formData.established_year}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 1961"
                            min="1800"
                            max={new Date().getFullYear()}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            College Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="college_type"
                            value={formData.college_type}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="University">University</option>
                            <option value="College">College</option>
                            <option value="Institute">Institute</option>
                            <option value="School">School</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ownership <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="ownership"
                            value={formData.ownership}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Private">Private</option>
                            <option value="Government">Government</option>
                            <option value="Public-Private">Public-Private</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Delhi"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., New Delhi"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 110016"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Full address of the college"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            step="any"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 28.5449"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            step="any"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 77.1927"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website URL
                          </label>
                          <input
                            type="url"
                            name="website_url"
                            value={formData.website_url}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://www.example.edu"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+91 1234567890"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="info@college.edu"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Additional Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief description about the college..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Logo URL
                          </label>
                          <input
                            type="url"
                            name="logo_url"
                            value={formData.logo_url}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/logo.png"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Enter the full URL to the college logo image
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>

                        <div className="flex items-start gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="is_featured"
                              checked={formData.is_featured}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Featured College</span>
                              <p className="text-xs text-gray-500">Display this college prominently</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="is_verified"
                              checked={formData.is_verified}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Verified</span>
                              <p className="text-xs text-gray-500">Mark as officially verified</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingCollege ? 'Update College' : 'Create College'}
                    </button>
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
