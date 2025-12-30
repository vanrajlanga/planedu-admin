'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'
import { scholarshipAPI } from '@/lib/api'

export default function ScholarshipsPage() {
  const router = useRouter()
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})

  // Filters
  const [search, setSearch] = useState('')
  const [scholarshipType, setScholarshipType] = useState('')
  const [country, setCountry] = useState('')
  const [isActive, setIsActive] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState(null)
  const [formData, setFormData] = useState({
    scholarship_name: '',
    slug: '',
    provider_name: '',
    scholarship_type: '',
    country: '',
    scholarship_amount: '',
    currency: 'INR',
    eligibility_criteria: '',
    application_deadline: '',
    is_active: true
  })

  const scholarshipTypes = ['Merit-Based', 'Need-Based', 'Sports', 'Minority', 'Women', 'Research', 'Government', 'Private']
  const countries = ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Singapore', 'Other']
  const currencies = ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD']

  useEffect(() => {
    fetchScholarships()
  }, [search, scholarshipType, country, isActive])

  const fetchScholarships = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page: page.toString(),
        limit: '25',
        ...(search && { search }),
        ...(scholarshipType && { scholarship_type: scholarshipType }),
        ...(country && { country }),
        ...(isActive && { is_active: isActive })
      }

      const response = await scholarshipAPI.getScholarships(params)

      if (response.data.success) {
        setScholarships(response.data.data)
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          total: response.data.pagination.total,
          hasNext: response.data.pagination.page < response.data.pagination.pages,
          hasPrev: response.data.pagination.page > 1
        })
      }
    } catch (error) {
      console.error('Failed to fetch scholarships:', error)
      toast.error('Failed to load scholarships')
      setScholarships([])
      setPagination({ page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (scholarship = null) => {
    if (scholarship) {
      setEditingScholarship(scholarship)
      setFormData({
        scholarship_name: scholarship.scholarship_name || '',
        slug: scholarship.slug || '',
        provider_name: scholarship.provider_name || '',
        scholarship_type: scholarship.scholarship_type || '',
        country: scholarship.country || '',
        scholarship_amount: scholarship.scholarship_amount || '',
        currency: scholarship.currency || 'INR',
        eligibility_criteria: scholarship.eligibility_criteria || '',
        application_deadline: scholarship.application_deadline || '',
        is_active: scholarship.is_active
      })
    } else {
      setEditingScholarship(null)
      setFormData({
        scholarship_name: '',
        slug: '',
        provider_name: '',
        scholarship_type: '',
        country: '',
        scholarship_amount: '',
        currency: 'INR',
        eligibility_criteria: '',
        application_deadline: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingScholarship(null)
    setFormData({
      scholarship_name: '',
      slug: '',
      provider_name: '',
      scholarship_type: '',
      country: '',
      scholarship_amount: '',
      currency: 'INR',
      eligibility_criteria: '',
      application_deadline: '',
      is_active: true
    })
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.scholarship_name) {
      toast.error('Scholarship name is required')
      return
    }

    // Map frontend fields to backend fields
    const backendFormData = {
      scholarship_name: formData.scholarship_name,
      type: formData.scholarship_type,
      provider: formData.provider_name,
      country: formData.country,
      amount: formData.scholarship_amount,
      currency: formData.currency,
      eligibility: formData.eligibility_criteria,
      application_deadline: formData.application_deadline,
      status: formData.is_active ? 'active' : 'inactive'
    }

    try {
      if (editingScholarship) {
        await scholarshipAPI.updateScholarship(editingScholarship.scholarship_id, backendFormData)
        toast.success('Scholarship updated successfully')
      } else {
        await scholarshipAPI.createScholarship(backendFormData)
        toast.success('Scholarship created successfully')
      }

      handleCloseModal()
      fetchScholarships()
    } catch (error) {
      console.error('Failed to save scholarship:', error)
      toast.error(error.response?.data?.message || 'Failed to save scholarship')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) {
      return
    }

    try {
      await scholarshipAPI.deleteScholarship(id)
      toast.success('Scholarship deleted successfully')
      fetchScholarships()
    } catch (error) {
      console.error('Failed to delete scholarship:', error)
      toast.error('Failed to delete scholarship')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setScholarshipType('')
    setCountry('')
    setIsActive('')
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return '-'
    const symbols = { INR: '₹', USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', SGD: 'S$' }
    return `${symbols[currency] || currency} ${parseFloat(amount).toLocaleString()}`
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <AdminLayout>
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Scholarships Management</h1>
        <p className="text-gray-600 mt-1">Manage scholarship programs and opportunities</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search scholarships..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={scholarshipType}
            onChange={(e) => setScholarshipType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {scholarshipTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
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
            Clear Filters
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Scholarship
          </button>
        </div>
      </div>

      {/* Scholarships List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading scholarships...</p>
        </div>
      ) : scholarships.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No scholarships found</p>
          <p className="text-sm text-gray-400 mt-2">Click "Add New Scholarship" to create your first scholarship entry</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholarship Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scholarships.map((scholarship) => (
                    <tr key={scholarship.scholarship_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{scholarship.scholarship_name}</p>
                        <p className="text-xs text-gray-500">{scholarship.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{scholarship.provider_name || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {scholarship.scholarship_type ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            {scholarship.scholarship_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{scholarship.country || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(scholarship.scholarship_amount, scholarship.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDate(scholarship.application_deadline)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          scholarship.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {scholarship.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(scholarship)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(scholarship.scholarship_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {scholarships.length} of {pagination.total} scholarships
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchScholarships(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchScholarships(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingScholarship ? 'Edit Scholarship' : 'Create New Scholarship'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scholarship Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.scholarship_name}
                        onChange={(e) => setFormData({...formData, scholarship_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Prime Minister's Scholarship Scheme"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Auto-generated if left empty"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider/Organization
                      </label>
                      <input
                        type="text"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({...formData, provider_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Ministry of Education, Tata Trust"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scholarship Type
                      </label>
                      <select
                        value={formData.scholarship_type}
                        onChange={(e) => setFormData({...formData, scholarship_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type</option>
                        {scholarshipTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.scholarship_amount}
                        onChange={(e) => setFormData({...formData, scholarship_amount: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eligibility Criteria
                    </label>
                    <textarea
                      value={formData.eligibility_criteria}
                      onChange={(e) => setFormData({...formData, eligibility_criteria: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Enter eligibility criteria, academic requirements, income limits, etc."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Active (visible to users)
                    </label>
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
                    {editingScholarship ? 'Update Scholarship' : 'Create Scholarship'}
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
