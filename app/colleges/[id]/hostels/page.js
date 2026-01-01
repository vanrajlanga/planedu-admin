'use client'

import { useState, useEffect, use } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import CollegeSubNav from '../../../components/CollegeSubNav'
import { hostelAPI, collegeAPI } from '../../../../lib/api'

const HOSTEL_TYPES = [
  { value: 'boys', label: 'Boys Hostel' },
  { value: 'girls', label: 'Girls Hostel' },
  { value: 'co-ed', label: 'Co-ed Hostel' },
]

const COMMON_AMENITIES = [
  'WiFi',
  'AC',
  'Gym',
  'Laundry',
  'Mess',
  'Library',
  'TV Room',
  'Sports Facilities',
  'Medical Facility',
  '24/7 Security',
  'Hot Water',
  'Power Backup',
  'Parking',
  'Cafeteria',
]

export default function HostelsPage({ params }) {
  const resolvedParams = use(params)
  const collegeId = resolvedParams.id

  const [college, setCollege] = useState(null)
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    hostel_type: '',
    name: '',
    total_capacity: '',
    fee_per_semester: '',
    mess_fee_per_semester: '',
    amenities: [],
    description: '',
    status: 'active',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [collegeRes, hostelsRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        hostelAPI.getHostels(collegeId),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (hostelsRes.data.success) {
        setHostels(hostelsRes.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      hostel_type: '',
      name: '',
      total_capacity: '',
      fee_per_semester: '',
      mess_fee_per_semester: '',
      amenities: [],
      description: '',
      status: 'active',
    })
    setEditingHostel(null)
  }

  const handleOpenModal = (hostel = null) => {
    if (hostel) {
      setEditingHostel(hostel)
      setFormData({
        hostel_type: hostel.hostel_type || '',
        name: hostel.name || '',
        total_capacity: hostel.total_capacity || '',
        fee_per_semester: hostel.fee_per_semester || '',
        mess_fee_per_semester: hostel.mess_fee_per_semester || '',
        amenities: hostel.amenities || [],
        description: hostel.description || '',
        status: hostel.status || 'active',
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      const data = {
        hostel_type: formData.hostel_type,
        name: formData.name || null,
        total_capacity: formData.total_capacity ? parseInt(formData.total_capacity) : null,
        fee_per_semester: formData.fee_per_semester ? parseFloat(formData.fee_per_semester) : null,
        mess_fee_per_semester: formData.mess_fee_per_semester ? parseFloat(formData.mess_fee_per_semester) : null,
        amenities: formData.amenities.length > 0 ? formData.amenities : null,
        description: formData.description || null,
        status: formData.status,
      }

      let response
      if (editingHostel) {
        response = await hostelAPI.updateHostel(collegeId, editingHostel.id, data)
      } else {
        response = await hostelAPI.createHostel(collegeId, data)
      }

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: editingHostel ? 'Hostel updated successfully' : 'Hostel created successfully',
        })
        handleCloseModal()
        fetchData()
      }
    } catch (err) {
      console.error('Error saving hostel:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save hostel',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (hostel) => {
    if (!confirm(`Delete ${hostel.name || hostel.hostel_type} hostel?`)) {
      return
    }

    try {
      const response = await hostelAPI.deleteHostel(collegeId, hostel.id)

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: 'Hostel deleted successfully',
        })
        fetchData()
      }
    } catch (err) {
      console.error('Error deleting hostel:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete hostel',
      })
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getHostelTypeLabel = (type) => {
    const found = HOSTEL_TYPES.find(t => t.value === type)
    return found ? found.label : type
  }

  const getHostelTypeIcon = (type) => {
    switch (type) {
      case 'boys':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'girls':
        return (
          <svg className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      default:
        return (
          <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
    }
  }

  if (!college) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{college.college_name}</h1>
            <p className="text-sm text-gray-500">Manage hostel facilities and accommodation</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Hostel
          </button>
        </div>

        {/* Sub Navigation */}
        <CollegeSubNav collegeId={collegeId} activeTab="hostels" />

        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {status.message}
          </div>
        )}

        {/* Hostels Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : hostels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hostels</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add hostel information including capacity, fees, and amenities.
            </p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Hostel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((hostel) => (
              <div key={hostel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getHostelTypeIcon(hostel.hostel_type)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {hostel.name || getHostelTypeLabel(hostel.hostel_type)}
                        </h3>
                        <p className="text-sm text-gray-500">{getHostelTypeLabel(hostel.hostel_type)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hostel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {hostel.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {hostel.total_capacity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Capacity</span>
                        <span className="text-gray-900 font-medium">{hostel.total_capacity} students</span>
                      </div>
                    )}
                    {hostel.fee_per_semester && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fee/Semester</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(hostel.fee_per_semester)}</span>
                      </div>
                    )}
                    {hostel.mess_fee_per_semester && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mess Fee/Semester</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(hostel.mess_fee_per_semester)}</span>
                      </div>
                    )}
                  </div>

                  {hostel.amenities && hostel.amenities.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {hostel.amenities.slice(0, 4).map((amenity) => (
                          <span key={amenity} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {amenity}
                          </span>
                        ))}
                        {hostel.amenities.length > 4 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{hostel.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => handleOpenModal(hostel)}
                    className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(hostel)}
                    className="text-sm text-red-600 hover:text-red-900 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={handleCloseModal}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[70vh] overflow-y-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingHostel ? 'Edit Hostel' : 'Add Hostel'}
                    </h3>

                    <div className="space-y-4">
                      {/* Hostel Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hostel Type *
                        </label>
                        <select
                          value={formData.hostel_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, hostel_type: e.target.value }))}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select Type</option>
                          {HOSTEL_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hostel Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Vivekananda Hall"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Capacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.total_capacity}
                          onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: e.target.value }))}
                          placeholder="Number of students"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Fees */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fee/Semester (INR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.fee_per_semester}
                            onChange={(e) => setFormData(prev => ({ ...prev, fee_per_semester: e.target.value }))}
                            placeholder="e.g., 25000"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mess Fee/Semester (INR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.mess_fee_per_semester}
                            onChange={(e) => setFormData(prev => ({ ...prev, mess_fee_per_semester: e.target.value }))}
                            placeholder="e.g., 15000"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Amenities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amenities
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_AMENITIES.map((amenity) => (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => handleAmenityToggle(amenity)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                formData.amenities.includes(amenity)
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                              }`}
                            >
                              {amenity}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          placeholder="Brief description of the hostel facilities..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : (editingHostel ? 'Update' : 'Create')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
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
