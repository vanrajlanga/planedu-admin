'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, courseAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import toast from 'react-hot-toast'

const DEGREE_TYPES = [
  'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'MBA', 'BBA', 'B.Sc', 'M.Sc',
  'B.Com', 'M.Com', 'B.A.', 'M.A.', 'B.Des', 'M.Des', 'BCA', 'MCA',
  'MBBS', 'MD', 'BDS', 'B.Pharm', 'M.Pharm', 'LLB', 'LLM', 'PhD', 'Other'
]

const STREAMS = [
  'Engineering', 'Management', 'Science', 'Commerce', 'Arts', 'Medical',
  'Law', 'Design', 'Pharmacy', 'Computer Applications', 'Other'
]

const COURSE_MODES = ['Full-time', 'Part-time', 'Distance', 'Online']

const FEES_TYPES = ['Per Year', 'Total', 'Per Semester']

export default function CoursesPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [courses, setCourses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const [formData, setFormData] = useState({
    course_name: '',
    short_name: '',
    degree_type: '',
    duration: '',
    stream: '',
    specialization: '',
    total_fees: '',
    fees_type: 'Per Year',
    eligibility: '',
    seats_available: '',
    course_mode: 'Full-time',
    description: '',
    status: 'active',
    is_featured: false,
    application_start_date: '',
    application_end_date: '',
    brochure_url: '',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [collegeRes, coursesRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        courseAPI.getCourses({ college_id: collegeId, limit: 100 }),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const openCreateModal = () => {
    setEditingCourse(null)
    setFormData({
      course_name: '',
      short_name: '',
      degree_type: '',
      duration: '',
      stream: '',
      specialization: '',
      total_fees: '',
      fees_type: 'Per Year',
      eligibility: '',
      seats_available: '',
      course_mode: 'Full-time',
      description: '',
      status: 'active',
      is_featured: false,
      application_start_date: '',
      application_end_date: '',
      brochure_url: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (course) => {
    setEditingCourse(course)
    setFormData({
      course_name: course.course_name || '',
      short_name: course.short_name || '',
      degree_type: course.degree_type || '',
      duration: course.duration || '',
      stream: course.stream || '',
      specialization: course.specialization || '',
      total_fees: course.total_fees || '',
      fees_type: course.fees_type || 'Per Year',
      eligibility: course.eligibility || '',
      seats_available: course.seats_available || '',
      course_mode: course.course_mode || 'Full-time',
      description: course.description || '',
      status: course.status || 'active',
      is_featured: course.is_featured || false,
      application_start_date: course.application_start_date ? course.application_start_date.split('T')[0] : '',
      application_end_date: course.application_end_date ? course.application_end_date.split('T')[0] : '',
      brochure_url: course.brochure_url || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.course_name || !formData.degree_type) {
      toast.error('Course name and degree type are required')
      return
    }

    try {
      setSaving(true)

      const dataToSave = {
        ...formData,
        college_id: collegeId,
        total_fees: formData.total_fees ? parseFloat(formData.total_fees) : null,
        seats_available: formData.seats_available ? parseInt(formData.seats_available) : null,
      }

      if (editingCourse) {
        const response = await courseAPI.updateCourse(editingCourse.course_id, dataToSave)
        if (response.data.success) {
          toast.success('Course updated successfully')
          fetchData()
        }
      } else {
        const response = await courseAPI.createCourse(dataToSave)
        if (response.data.success) {
          toast.success('Course created successfully')
          fetchData()
        }
      }

      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save course:', error)
      toast.error(error.response?.data?.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (courseId) => {
    try {
      const response = await courseAPI.deleteCourse(courseId)
      if (response.data.success) {
        toast.success('Course deleted successfully')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    } finally {
      setDeleteConfirmId(null)
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

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatApplicationPeriod = (startDate, endDate) => {
    if (!startDate && !endDate) return null
    const start = startDate ? formatDate(startDate) : '?'
    const end = endDate ? formatDate(endDate) : '?'
    return `${start} - ${end}`
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
                  <h2 className="text-xl font-semibold text-gray-900">Courses & Fees</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage courses offered by {college.college_name}
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Course
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a course.</p>
                  <div className="mt-6">
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Course
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Application Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course.course_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.course_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.degree_type}
                                {course.specialization && ` - ${course.specialization}`}
                              </div>
                              {course.stream && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  {course.stream}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.duration || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(course.total_fees)}
                            </div>
                            {course.fees_type && (
                              <div className="text-xs text-gray-500">{course.fees_type}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatApplicationPeriod(course.application_start_date, course.application_end_date) ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {formatApplicationPeriod(course.application_start_date, course.application_end_date)}
                                </div>
                                {course.brochure_url && (
                                  <a
                                    href={course.brochure_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Brochure
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              course.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(course)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            {deleteConfirmId === course.course_id ? (
                              <span className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(course.course_id)}
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
                                onClick={() => setDeleteConfirmId(course.course_id)}
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
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="course_name"
                      value={formData.course_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Bachelor of Technology in Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                    <input
                      type="text"
                      name="short_name"
                      value={formData.short_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., B.Tech CSE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Degree Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="degree_type"
                      value={formData.degree_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Degree</option>
                      {DEGREE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                    <select
                      name="stream"
                      value={formData.stream}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Stream</option>
                      {STREAMS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 4 Years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Mode</label>
                    <select
                      name="course_mode"
                      value={formData.course_mode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {COURSE_MODES.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (INR)</label>
                    <input
                      type="number"
                      name="total_fees"
                      value={formData.total_fees}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 800000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fees Type</label>
                    <select
                      name="fees_type"
                      value={formData.fees_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {FEES_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seats Available</label>
                    <input
                      type="number"
                      name="seats_available"
                      value={formData.seats_available}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 120"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
                    <input
                      type="text"
                      name="eligibility"
                      value={formData.eligibility}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 10+2 with 75% in PCM, JEE Advanced qualification"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Brief description of the course..."
                    />
                  </div>

                  {/* Application Period */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Application Period</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="application_start_date"
                          value={formData.application_start_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          name="application_end_date"
                          value={formData.application_end_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brochure URL */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
                    <input
                      type="url"
                      name="brochure_url"
                      value={formData.brochure_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://example.com/course-brochure.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured Course</span>
                    </label>
                  </div>
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
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
