'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, placementAPI, courseAPI, recruiterAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import SectionContentEditor from '@/app/components/SectionContentEditor'
import toast from 'react-hot-toast'

const ACADEMIC_YEARS = (() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(`${i}-${(i + 1).toString().slice(-2)}`)
  }
  return years
})()

export default function PlacementsPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [placements, setPlacements] = useState([])
  const [courses, setCourses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Recruiters state
  const [selectedPlacement, setSelectedPlacement] = useState(null)
  const [recruiters, setRecruiters] = useState([])
  const [loadingRecruiters, setLoadingRecruiters] = useState(false)
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false)
  const [editingRecruiter, setEditingRecruiter] = useState(null)
  const [savingRecruiter, setSavingRecruiter] = useState(false)
  const [recruiterForm, setRecruiterForm] = useState({
    company_name: '',
    company_logo_url: '',
    sector: '',
    offers_count: '',
    package_offered: '',
  })

  const [formData, setFormData] = useState({
    academic_year: '',
    course_id: '',
    total_students: '',
    students_placed: '',
    highest_package: '',
    average_package: '',
    median_package: '',
    currency: 'INR',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [collegeRes, placementsRes, coursesRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        placementAPI.getPlacementStatsByCollege(collegeId),
        courseAPI.getCourses({ college_id: collegeId, limit: 100 }),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (placementsRes.data.success) {
        setPlacements(placementsRes.data.data || [])
      }

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load placements')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const openCreateModal = () => {
    setEditingPlacement(null)
    setFormData({
      academic_year: ACADEMIC_YEARS[0],
      course_id: '',
      total_students: '',
      students_placed: '',
      highest_package: '',
      average_package: '',
      median_package: '',
      currency: 'INR',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (placement) => {
    setEditingPlacement(placement)
    setFormData({
      academic_year: placement.academic_year || '',
      course_id: placement.course_id || '',
      total_students: placement.total_students || '',
      students_placed: placement.students_placed || '',
      highest_package: placement.highest_package || '',
      average_package: placement.average_package || '',
      median_package: placement.median_package || '',
      currency: placement.currency || 'INR',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.academic_year || !formData.total_students || !formData.students_placed) {
      toast.error('Academic year, total students, and students placed are required')
      return
    }

    try {
      setSaving(true)

      const dataToSave = {
        college_id: collegeId,
        academic_year: formData.academic_year,
        course_id: formData.course_id || null,
        total_students: parseInt(formData.total_students),
        students_placed: parseInt(formData.students_placed),
        highest_package: formData.highest_package ? parseFloat(formData.highest_package) : null,
        average_package: formData.average_package ? parseFloat(formData.average_package) : null,
        median_package: formData.median_package ? parseFloat(formData.median_package) : null,
        currency: formData.currency,
      }

      if (editingPlacement) {
        const response = await placementAPI.updatePlacement(editingPlacement.placement_id, dataToSave)
        if (response.data.success) {
          toast.success('Placement record updated successfully')
          fetchData()
        }
      } else {
        const response = await placementAPI.createPlacement(dataToSave)
        if (response.data.success) {
          toast.success('Placement record created successfully')
          fetchData()
        }
      }

      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save placement:', error)
      toast.error(error.response?.data?.message || 'Failed to save placement record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (placementId) => {
    try {
      const response = await placementAPI.deletePlacement(placementId)
      if (response.data.success) {
        toast.success('Placement record deleted successfully')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete placement:', error)
      toast.error('Failed to delete placement record')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  // Recruiter functions
  const SECTORS = [
    'IT/Software', 'Consulting', 'BFSI', 'FMCG', 'Core Engineering',
    'Analytics', 'E-Commerce', 'Healthcare', 'Automobile', 'Others'
  ]

  const fetchRecruiters = async (placementId) => {
    try {
      setLoadingRecruiters(true)
      const response = await recruiterAPI.getRecruiters(placementId)
      if (response.data.success) {
        setRecruiters(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recruiters:', error)
      toast.error('Failed to load recruiters')
    } finally {
      setLoadingRecruiters(false)
    }
  }

  const toggleRecruiters = async (placement) => {
    if (selectedPlacement?.placement_id === placement.placement_id) {
      setSelectedPlacement(null)
      setRecruiters([])
    } else {
      setSelectedPlacement(placement)
      await fetchRecruiters(placement.placement_id)
    }
  }

  const openRecruiterModal = (recruiter = null) => {
    if (recruiter) {
      setEditingRecruiter(recruiter)
      setRecruiterForm({
        company_name: recruiter.company_name || '',
        company_logo_url: recruiter.company_logo_url || '',
        sector: recruiter.sector || '',
        offers_count: recruiter.offers_count || '',
        package_offered: recruiter.package_offered || '',
      })
    } else {
      setEditingRecruiter(null)
      setRecruiterForm({
        company_name: '',
        company_logo_url: '',
        sector: '',
        offers_count: '',
        package_offered: '',
      })
    }
    setIsRecruiterModalOpen(true)
  }

  const handleRecruiterSubmit = async (e) => {
    e.preventDefault()
    if (!recruiterForm.company_name) {
      toast.error('Company name is required')
      return
    }

    try {
      setSavingRecruiter(true)
      const data = {
        company_name: recruiterForm.company_name,
        company_logo_url: recruiterForm.company_logo_url || null,
        sector: recruiterForm.sector || null,
        offers_count: recruiterForm.offers_count ? parseInt(recruiterForm.offers_count) : null,
        package_offered: recruiterForm.package_offered ? parseFloat(recruiterForm.package_offered) : null,
      }

      if (editingRecruiter) {
        await recruiterAPI.updateRecruiter(selectedPlacement.placement_id, editingRecruiter.id, data)
        toast.success('Recruiter updated successfully')
      } else {
        await recruiterAPI.createRecruiter(selectedPlacement.placement_id, data)
        toast.success('Recruiter added successfully')
      }

      setIsRecruiterModalOpen(false)
      await fetchRecruiters(selectedPlacement.placement_id)
    } catch (error) {
      console.error('Failed to save recruiter:', error)
      toast.error(error.response?.data?.message || 'Failed to save recruiter')
    } finally {
      setSavingRecruiter(false)
    }
  }

  const handleDeleteRecruiter = async (recruiterId) => {
    if (!confirm('Delete this recruiter?')) return

    try {
      await recruiterAPI.deleteRecruiter(selectedPlacement.placement_id, recruiterId)
      toast.success('Recruiter deleted successfully')
      await fetchRecruiters(selectedPlacement.placement_id)
    } catch (error) {
      console.error('Failed to delete recruiter:', error)
      toast.error('Failed to delete recruiter')
    }
  }

  const formatPackage = (amount, currency = 'INR') => {
    if (!amount) return '-'
    if (currency === 'INR') {
      if (amount >= 10000000) {
        return `${(amount / 10000000).toFixed(2)} Cr`
      } else if (amount >= 100000) {
        return `${(amount / 100000).toFixed(2)} LPA`
      }
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
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
        <CollegeSubNav collegeId={collegeId} collegeName={college.college_name} />

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Placement Statistics</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage placement data for {college.college_name}
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Placement Data
                </button>
              </div>
            </div>

            {/* Content Editor Section */}
            <SectionContentEditor
              collegeId={collegeId}
              sectionType="placement"
              sectionLabel="Placements"
              collegeName={college.college_name}
            />

            {/* Summary Cards */}
            {placements.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Latest Year</div>
                  <div className="text-2xl font-bold text-gray-900">{placements[0]?.academic_year || '-'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Highest Package</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPackage(placements[0]?.highest_package)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Average Package</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPackage(placements[0]?.average_package)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Placement Rate</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {placements[0]?.placement_percentage ? `${placements[0].placement_percentage}%` : '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Placements Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {placements.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No placement records</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding placement data.</p>
                  <div className="mt-6">
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Placement Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Academic Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Placement %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Highest Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Package
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {placements.map((placement) => (
                        <tr key={placement.placement_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {placement.academic_year}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {placement.course_name || 'All Courses'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {placement.students_placed} / {placement.total_students}
                            </div>
                            <div className="text-xs text-gray-500">placed / total</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(placement.placement_percentage || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {placement.placement_percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatPackage(placement.highest_package, placement.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {formatPackage(placement.average_package, placement.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => toggleRecruiters(placement)}
                              className={`mr-3 ${selectedPlacement?.placement_id === placement.placement_id ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              Recruiters
                            </button>
                            <button
                              onClick={() => openEditModal(placement)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            {deleteConfirmId === placement.placement_id ? (
                              <span className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(placement.placement_id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(placement.placement_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recruiters Section */}
            {selectedPlacement && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Top Recruiters - {selectedPlacement.academic_year}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {recruiters.length} recruiter{recruiters.length !== 1 ? 's' : ''} listed
                    </p>
                  </div>
                  <button
                    onClick={() => openRecruiterModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Recruiter
                  </button>
                </div>

                {loadingRecruiters ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : recruiters.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recruiters added</h3>
                    <p className="mt-1 text-sm text-gray-500">Add companies that recruited from this batch.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                    {recruiters.map((recruiter) => (
                      <div
                        key={recruiter.id}
                        className="bg-gray-50 rounded-lg p-4 relative group hover:shadow-md transition-shadow"
                      >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => openRecruiterModal(recruiter)}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRecruiter(recruiter.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {recruiter.company_logo_url ? (
                          <img
                            src={recruiter.company_logo_url}
                            alt={recruiter.company_name}
                            className="h-12 w-auto mx-auto mb-3 object-contain"
                          />
                        ) : (
                          <div className="h-12 w-12 mx-auto mb-3 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-500">
                              {recruiter.company_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {recruiter.company_name}
                          </div>
                          {recruiter.sector && (
                            <div className="text-xs text-gray-500">{recruiter.sector}</div>
                          )}
                          <div className="mt-2 flex justify-center gap-2 text-xs">
                            {recruiter.offers_count && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {recruiter.offers_count} offers
                              </span>
                            )}
                            {recruiter.package_offered && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                {formatPackage(recruiter.package_offered)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingPlacement ? 'Edit Placement Record' : 'Add Placement Data'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Year</option>
                      {ACADEMIC_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
                    <select
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Students <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="total_students"
                      value={formData.total_students}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Students Placed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="students_placed"
                      value={formData.students_placed}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 450"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Highest Package (INR)</label>
                    <input
                      type="number"
                      name="highest_package"
                      value={formData.highest_package}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 20000000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter in rupees (e.g., 2 Cr = 20000000)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Average Package (INR)</label>
                    <input
                      type="number"
                      name="average_package"
                      value={formData.average_package}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 1800000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter in rupees (e.g., 18 LPA = 1800000)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Median Package (INR)</label>
                    <input
                      type="number"
                      name="median_package"
                      value={formData.median_package}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 1500000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="INR">INR (Indian Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {formData.total_students && formData.students_placed && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="text-sm text-gray-500 mb-2">Preview</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Placement Rate:</span>
                      <span className="text-lg font-bold text-green-600">
                        {((parseInt(formData.students_placed) / parseInt(formData.total_students)) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

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
                  {saving ? 'Saving...' : editingPlacement ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Modal */}
      {isRecruiterModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <form onSubmit={handleRecruiterSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingRecruiter ? 'Edit Recruiter' : 'Add Recruiter'}
                  </h3>
                  <button type="button" onClick={() => setIsRecruiterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recruiterForm.company_name}
                    onChange={(e) => setRecruiterForm(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Google"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
                  <input
                    type="url"
                    value={recruiterForm.company_logo_url}
                    onChange={(e) => setRecruiterForm(prev => ({ ...prev, company_logo_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <select
                    value={recruiterForm.sector}
                    onChange={(e) => setRecruiterForm(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Sector</option>
                    {SECTORS.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offers Count</label>
                    <input
                      type="number"
                      value={recruiterForm.offers_count}
                      onChange={(e) => setRecruiterForm(prev => ({ ...prev, offers_count: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Offered (INR)</label>
                    <input
                      type="number"
                      value={recruiterForm.package_offered}
                      onChange={(e) => setRecruiterForm(prev => ({ ...prev, package_offered: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 4500000"
                    />
                    <p className="text-xs text-gray-500 mt-1">45 LPA = 4500000</p>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecruiterModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecruiter}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingRecruiter ? 'Saving...' : editingRecruiter ? 'Update' : 'Add Recruiter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
