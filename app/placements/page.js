'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'
import { placementAPI, collegeAPI } from '@/lib/api'

export default function PlacementsPage() {
  const router = useRouter()
  const [placements, setPlacements] = useState([])
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAcademicYear, setFilterAcademicYear] = useState('')
  const [filterCollege, setFilterCollege] = useState('')

  const [formData, setFormData] = useState({
    college_id: '',
    course_id: null,
    academic_year: '',
    total_students: '',
    students_placed: '',
    placement_percentage: '',
    highest_package: '',
    average_package: '',
    median_package: '',
    currency: 'INR'
  })

  const academicYears = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26']
  const currencies = ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD']

  useEffect(() => {
    fetchPlacements()
    fetchColleges()
  }, [])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      const params = {
        page: '1',
        limit: '100',
        ...(filterAcademicYear && { academic_year: filterAcademicYear }),
        ...(filterCollege && { college_id: filterCollege })
      }

      const response = await placementAPI.getPlacements(params)

      if (response.data.success) {
        setPlacements(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching placements:', error)
      toast.error('Failed to load placements')
      setPlacements([])
    } finally {
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await collegeAPI.getColleges({ page: '1', limit: '1000' })

      if (response.data.success) {
        setColleges(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching colleges:', error)
      setColleges([])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let updatedFormData = { ...formData, [name]: value }

    // Auto-calculate placement percentage
    if (name === 'total_students' || name === 'students_placed') {
      const total = parseInt(name === 'total_students' ? value : formData.total_students) || 0
      const placed = parseInt(name === 'students_placed' ? value : formData.students_placed) || 0
      if (total > 0) {
        updatedFormData.placement_percentage = ((placed / total) * 100).toFixed(2)
      }
    }

    setFormData(updatedFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.college_id || !formData.academic_year) {
      toast.error('College and academic year are required')
      return
    }

    try {
      if (editingPlacement) {
        await placementAPI.updatePlacement(editingPlacement.placement_id, formData)
        toast.success('Placement updated successfully!')
      } else {
        await placementAPI.createPlacement(formData)
        toast.success('Placement added successfully!')
      }

      setShowModal(false)
      resetForm()
      fetchPlacements()
    } catch (error) {
      console.error('Error saving placement:', error)
      toast.error(error.response?.data?.message || 'Failed to save placement')
    }
  }

  const handleEdit = (placement) => {
    setEditingPlacement(placement)
    setFormData({
      college_id: placement.college_id || '',
      course_id: placement.course_id || null,
      academic_year: placement.academic_year || '',
      total_students: placement.total_students || '',
      students_placed: placement.students_placed || '',
      placement_percentage: placement.placement_percentage || '',
      highest_package: placement.highest_package || '',
      average_package: placement.average_package || '',
      median_package: placement.median_package || '',
      currency: placement.currency || 'INR'
    })
    setShowModal(true)
  }

  const handleDelete = async (placementId) => {
    if (!confirm('Are you sure you want to delete this placement record?')) return

    try {
      await placementAPI.deletePlacement(placementId)
      toast.success('Placement deleted successfully!')
      fetchPlacements()
    } catch (error) {
      console.error('Error deleting placement:', error)
      toast.error('Failed to delete placement')
    }
  }

  const resetForm = () => {
    setFormData({
      college_id: '',
      course_id: null,
      academic_year: '',
      total_students: '',
      students_placed: '',
      placement_percentage: '',
      highest_package: '',
      average_package: '',
      median_package: '',
      currency: 'INR'
    })
    setEditingPlacement(null)
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return '-'
    const symbols = {
      INR: '₹',
      USD: '$',
      GBP: '£',
      EUR: '€',
      CAD: 'C$',
      AUD: 'A$'
    }
    return `${symbols[currency] || currency} ${parseFloat(amount).toLocaleString()}`
  }

  const getCollegeName = (collegeId) => {
    if (!Array.isArray(colleges)) return 'Unknown College'
    const college = colleges.find(c => c.college_id === collegeId)
    return college ? college.college_name : 'Unknown College'
  }

  const filteredPlacements = placements.filter(placement => {
    const matchesSearch = getCollegeName(placement.college_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         placement.academic_year.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = filterAcademicYear === '' || placement.academic_year === filterAcademicYear
    const matchesCollege = filterCollege === '' || placement.college_id === parseInt(filterCollege)

    return matchesSearch && matchesYear && matchesCollege
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Placement Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage college placement records and statistics
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Placement</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search placements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterCollege}
                onChange={(e) => setFilterCollege(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Colleges</option>
                {Array.isArray(colleges) && colleges.map(college => (
                  <option key={college.college_id} value={college.college_id}>
                    {college.college_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{filteredPlacements.length}</span>
              <span className="ml-1">placement{filteredPlacements.length !== 1 ? 's' : ''} found</span>
            </div>
          </div>
        </div>

        {/* Placements Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">Loading placements...</p>
            </div>
          ) : filteredPlacements.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No placements found</h3>
              <p className="text-gray-600">Get started by adding your first placement record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placement %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packages</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPlacements.map((placement) => (
                    <tr key={placement.placement_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {placement.college_name || 'Unknown College'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {placement.academic_year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {placement.students_placed}/{placement.total_students}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(placement.placement_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {placement.placement_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-500">High:</span>{' '}
                            <span className="font-medium text-gray-900">
                              {formatCurrency(placement.highest_package, placement.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg:</span>{' '}
                            <span className="font-medium text-gray-900">
                              {formatCurrency(placement.average_package, placement.currency)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(placement)}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(placement.placement_id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPlacement ? 'Edit Placement Record' : 'Add Placement Record'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="college_id"
                    value={formData.college_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select College</option>
                    {Array.isArray(colleges) && colleges.map(college => (
                      <option key={college.college_id} value={college.college_id}>
                        {college.college_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Total Students */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Students
                  </label>
                  <input
                    type="number"
                    name="total_students"
                    value={formData.total_students}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter total students"
                  />
                </div>

                {/* Students Placed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Students Placed
                  </label>
                  <input
                    type="number"
                    name="students_placed"
                    value={formData.students_placed}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter students placed"
                  />
                </div>

                {/* Placement Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placement Percentage
                  </label>
                  <input
                    type="number"
                    name="placement_percentage"
                    value={formData.placement_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                {/* Highest Package */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Package
                  </label>
                  <input
                    type="number"
                    name="highest_package"
                    value={formData.highest_package}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter highest package"
                  />
                </div>

                {/* Average Package */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Package
                  </label>
                  <input
                    type="number"
                    name="average_package"
                    value={formData.average_package}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter average package"
                  />
                </div>

                {/* Median Package */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Median Package
                  </label>
                  <input
                    type="number"
                    name="median_package"
                    value={formData.median_package}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter median package"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingPlacement ? 'Update Placement' : 'Add Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
