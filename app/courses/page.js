'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { courseAPI, collegeAPI, courseTypesAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [colleges, setColleges] = useState([])
  const [courseTypes, setCourseTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 20
  })

  const [filters, setFilters] = useState({
    search: '',
    college_id: '',
    degree_type: '',
    stream: '',
    course_mode: '',
    status: '',
    sort_by: 'created_at',
    sort_order: 'DESC',
    page: 1,
    limit: 20
  })

  const [formData, setFormData] = useState({
    college_id: '',
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
    is_featured: false
  })

  useEffect(() => {
    fetchColleges()
    fetchCourseTypes()
    fetchCourses()
  }, [filters])

  const fetchCourseTypes = async () => {
    try {
      const response = await courseTypesAPI.getAll({ status: 'active' })
      if (response.data.success) {
        setCourseTypes(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch course types:', error)
      setCourseTypes([])
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await collegeAPI.getColleges({ limit: 1000, status: 'active' })
      if (response.data.success) {
        // API returns { data: { colleges: [...] } } structure
        const collegesData = response.data.data?.colleges || response.data.data || []
        setColleges(Array.isArray(collegesData) ? collegesData : [])
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error)
      setColleges([])
    }
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await courseAPI.getCourses(filters)

      if (response.data.success) {
        const data = Array.isArray(response.data.data) ? response.data.data : []
        setCourses(data)

        if (response.data.pagination) {
          setPagination({
            total: response.data.pagination.total || 0,
            currentPage: response.data.pagination.currentPage || response.data.pagination.page || 1,
            totalPages: response.data.pagination.totalPages || response.data.pagination.pages || 1,
            limit: response.data.pagination.limit || 20
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load courses')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      college_id: '',
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
      is_featured: false
    })
  }

  const handleAddNew = () => {
    resetForm()
    setEditingCourse(null)
    setShowModal(true)
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      college_id: course.college_id || '',
      course_name: course.course_name || '',
      short_name: course.short_name || '',
      degree_type: course.degree_type || 'Bachelor',
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
      is_featured: course.is_featured || false
    })
    setShowModal(true)
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const response = await courseAPI.deleteCourse(courseId)
      if (response.data.success) {
        toast.success('Course deleted successfully')
        fetchCourses()
      }
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select courses to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedCourses.length} course(s)?`)) return

    try {
      await Promise.all(selectedCourses.map(id => courseAPI.deleteCourse(id)))
      toast.success(`${selectedCourses.length} course(s) deleted successfully`)
      setSelectedCourses([])
      fetchCourses()
    } catch (error) {
      console.error('Failed to delete courses:', error)
      toast.error('Failed to delete some courses')
    }
  }

  const handleBulkStatusUpdate = async (status) => {
    if (selectedCourses.length === 0) {
      toast.error('Please select courses to update')
      return
    }

    try {
      await Promise.all(selectedCourses.map(id => courseAPI.updateCourse(id, { status })))
      toast.success(`${selectedCourses.length} course(s) updated successfully`)
      setSelectedCourses([])
      fetchCourses()
    } catch (error) {
      console.error('Failed to update courses:', error)
      toast.error('Failed to update some courses')
    }
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

    if (!formData.college_id || !formData.course_name || !formData.degree_type) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' || typeof value === 'boolean') {
          acc[key] = value
        }
        return acc
      }, {})

      if (editingCourse) {
        const response = await courseAPI.updateCourse(editingCourse.course_id, dataToSubmit)
        if (response.data.success) {
          toast.success('Course updated successfully!')
          setShowModal(false)
          fetchCourses()
        }
      } else {
        const response = await courseAPI.createCourse(dataToSubmit)
        if (response.data.success) {
          toast.success('Course created successfully!')
          setShowModal(false)
          fetchCourses()
        }
      }
    } catch (error) {
      console.error('Failed to save course:', error)
      toast.error(error.response?.data?.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value, page: 1 })
  }

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage })
  }

  const toggleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([])
    } else {
      setSelectedCourses(courses.map(c => c.course_id))
    }
  }

  const toggleSelectCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId))
    } else {
      setSelectedCourses([...selectedCourses, courseId])
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return badges[status] || badges.pending
  }

  const formatFees = (fees, type) => {
    if (!fees) return 'N/A'
    return `₹${parseFloat(fees).toLocaleString('en-IN')} ${type || ''}`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Courses Management</h1>
            <p className="text-slate-600 mt-1">Manage all courses and their details</p>
          </div>
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search courses..."
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
              <select
                name="college_id"
                value={filters.college_id}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">All Colleges</option>
                {colleges.map(college => (
                  <option key={college.college_id} value={college.college_id}>
                    {college.college_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Degree Type</label>
              <select
                name="degree_type"
                value={filters.degree_type}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">All Types</option>
                {courseTypes.map(type => (
                  <option key={type.course_type_id} value={type.name}>
                    {type.name} - {type.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Mode</label>
              <select
                name="course_mode"
                value={filters.course_mode}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">All Modes</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Online">Online</option>
                <option value="Distance">Distance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
              <input
                type="text"
                name="stream"
                value={filters.stream}
                onChange={handleFilterChange}
                placeholder="e.g., Engineering"
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
              <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="created_at">Created Date</option>
                <option value="course_name">Course Name</option>
                <option value="total_fees">Fees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
              <select
                name="sort_order"
                value={filters.sort_order}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="DESC">Descending</option>
                <option value="ASC">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="card p-4 bg-primary-50 border border-primary-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                {selectedCourses.length} course(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('inactive')}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-slate-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mt-4 text-slate-600">No courses found</p>
              <button onClick={handleAddNew} className="btn-primary mt-4">
                Add Your First Course
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCourses.length === courses.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type & Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {courses.map((course) => (
                      <tr key={course.course_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.course_id)}
                            onChange={() => toggleSelectCourse(course.course_id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-medium text-slate-900">{course.course_name}</div>
                              {course.short_name && (
                                <div className="text-sm text-slate-500">{course.short_name}</div>
                              )}
                              {course.is_featured && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{course.college_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{course.degree_type}</div>
                          <div className="text-xs text-slate-500">{course.course_mode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{formatFees(course.total_fees, course.fees_type)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{course.seats_available || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(course.status)}`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(course)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(course.course_id)}
                              className="text-red-600 hover:text-red-900"
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
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total courses)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`px-3 py-1.5 text-sm border rounded ${
                            pagination.currentPage === i + 1
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        College <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="college_id"
                        value={formData.college_id}
                        onChange={handleChange}
                        required
                        className="input-base"
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college.college_id} value={college.college_id}>
                            {college.college_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Course Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="course_name"
                        value={formData.course_name}
                        onChange={handleChange}
                        required
                        className="input-base"
                        placeholder="e.g., Bachelor of Technology in Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Short Name</label>
                      <input
                        type="text"
                        name="short_name"
                        value={formData.short_name}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., B.Tech CSE"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Degree Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="degree_type"
                        value={formData.degree_type}
                        onChange={(e) => {
                          const selectedType = courseTypes.find(t => t.name === e.target.value)
                          setFormData({
                            ...formData,
                            degree_type: e.target.value,
                            duration: selectedType ? `${selectedType.duration_years} Years` : formData.duration
                          })
                        }}
                        required
                        className="input-base"
                      >
                        <option value="">Select Degree Type</option>
                        {courseTypes.map(type => (
                          <option key={type.course_type_id} value={type.name}>
                            {type.name} - {type.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., 4 Years"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
                      <input
                        type="text"
                        name="stream"
                        value={formData.stream}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., Engineering, Medical, Arts"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., Computer Science, Data Science"
                      />
                    </div>
                  </div>
                </div>

                {/* Fees & Seats */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fees & Seats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Total Fees (₹)</label>
                      <input
                        type="number"
                        name="total_fees"
                        value={formData.total_fees}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., 500000"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fees Type</label>
                      <select
                        name="fees_type"
                        value={formData.fees_type}
                        onChange={handleChange}
                        className="input-base"
                      >
                        <option value="Per Year">Per Year</option>
                        <option value="Total">Total</option>
                        <option value="Per Semester">Per Semester</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Available Seats</label>
                      <input
                        type="number"
                        name="seats_available"
                        value={formData.seats_available}
                        onChange={handleChange}
                        className="input-base"
                        placeholder="e.g., 120"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Course Mode</label>
                      <select
                        name="course_mode"
                        value={formData.course_mode}
                        onChange={handleChange}
                        className="input-base"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Online">Online</option>
                        <option value="Distance">Distance</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility Criteria</label>
                      <textarea
                        name="eligibility"
                        value={formData.eligibility}
                        onChange={handleChange}
                        rows={3}
                        className="input-base"
                        placeholder="e.g., 10+2 with 60% marks in PCM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="input-base"
                        placeholder="Brief description about the course..."
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="input-base"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-700">Featured Course</span>
                          <p className="text-xs text-slate-500">Display this course prominently</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
