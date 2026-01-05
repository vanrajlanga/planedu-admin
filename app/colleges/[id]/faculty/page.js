'use client'

import { useState, useEffect, use } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import CollegeSubNav from '../../../components/CollegeSubNav'
import { facultyAPI, collegeAPI, getBackendBaseUrl } from '../../../../lib/api'

// Helper to get full image URL (handles both relative paths and full URLs)
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('localhost:3000')) {
      return url.replace('http://localhost:3000', getBackendBaseUrl())
    }
    return url
  }
  return `${getBackendBaseUrl()}${url}`
}

const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Senior Lecturer',
  'Visiting Professor',
  'Emeritus Professor',
  'Dean',
  'Head of Department',
  'Director',
]

const COMMON_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electronics & Communication',
  'Chemical Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Management Studies',
  'Humanities & Social Sciences',
  'Biotechnology',
  'Design',
]

export default function FacultyPage({ params }) {
  const resolvedParams = use(params)
  const collegeId = resolvedParams.id

  const [college, setCollege] = useState(null)
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  // Filter
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    qualification: '',
    specialization: '',
    experience_years: '',
    email: '',
    phone: '',
    profile_url: '',
    status: 'active',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  useEffect(() => {
    if (collegeId) {
      fetchFaculty()
    }
  }, [collegeId, selectedDepartment])

  const fetchData = async () => {
    try {
      const collegeRes = await collegeAPI.getCollege(collegeId)
      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }
    } catch (err) {
      console.error('Error fetching college:', err)
      setError('Failed to load data')
    }
  }

  const fetchFaculty = async () => {
    try {
      setLoading(true)
      const response = await facultyAPI.getFaculty(collegeId, {
        department: selectedDepartment || undefined,
      })

      if (response.data.success) {
        setFaculty(response.data.data.faculty || [])
        setDepartments(response.data.data.departments || [])
      }
    } catch (err) {
      console.error('Error fetching faculty:', err)
      setError('Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      department: '',
      qualification: '',
      specialization: '',
      experience_years: '',
      email: '',
      phone: '',
      profile_url: '',
      status: 'active',
    })
    setEditingFaculty(null)
  }

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingFaculty(member)
      setFormData({
        name: member.name || '',
        designation: member.designation || '',
        department: member.department || '',
        qualification: member.qualification || '',
        specialization: member.specialization || '',
        experience_years: member.experience_years || '',
        email: member.email || '',
        phone: member.phone || '',
        profile_url: member.profile_url || '',
        status: member.status || 'active',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      const data = {
        name: formData.name,
        designation: formData.designation || null,
        department: formData.department || null,
        qualification: formData.qualification || null,
        specialization: formData.specialization || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        email: formData.email || null,
        phone: formData.phone || null,
        profile_url: formData.profile_url || null,
        status: formData.status,
      }

      let response
      if (editingFaculty) {
        response = await facultyAPI.updateFaculty(collegeId, editingFaculty.id, data)
      } else {
        response = await facultyAPI.createFaculty(collegeId, data)
      }

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: editingFaculty ? 'Faculty member updated successfully' : 'Faculty member added successfully',
        })
        handleCloseModal()
        fetchFaculty()
      }
    } catch (err) {
      console.error('Error saving faculty:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save faculty member',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member) => {
    if (!confirm(`Delete ${member.name}?`)) {
      return
    }

    try {
      const response = await facultyAPI.deleteFaculty(collegeId, member.id)

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: 'Faculty member deleted successfully',
        })
        fetchFaculty()
      }
    } catch (err) {
      console.error('Error deleting faculty:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete faculty member',
      })
    }
  }

  // Group faculty by department
  const groupedFaculty = faculty.reduce((acc, member) => {
    const dept = member.department || 'Other'
    if (!acc[dept]) {
      acc[dept] = []
    }
    acc[dept].push(member)
    return acc
  }, {})

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
            <p className="text-sm text-gray-500">Manage faculty members and staff</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Faculty
          </button>
        </div>

        {/* Sub Navigation */}
        <CollegeSubNav collegeId={collegeId} activeTab="faculty" />

        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {status.message}
          </div>
        )}

        {/* Filter */}
        {departments.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {selectedDepartment && (
                <div className="flex items-end">
                  <button
                    onClick={() => setSelectedDepartment('')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Faculty List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : faculty.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty members</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add faculty information including designation, qualifications, and contact details.
            </p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Faculty
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFaculty).map(([dept, members]) => (
              <div key={dept} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{dept}</h3>
                  <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <div key={member.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {member.profile_image_url ? (
                            <img
                              src={getImageUrl(member.profile_image_url)}
                              alt={member.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-500">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                          {member.designation && (
                            <p className="text-sm text-gray-600">{member.designation}</p>
                          )}
                          <div className="mt-1 flex flex-wrap gap-2">
                            {member.qualification && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {member.qualification}
                              </span>
                            )}
                            {member.experience_years && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {member.experience_years} years exp.
                              </span>
                            )}
                          </div>
                          {member.specialization && (
                            <p className="mt-1 text-xs text-gray-500">
                              Specialization: {member.specialization}
                            </p>
                          )}
                          {(member.email || member.phone) && (
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                              {member.email && (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {member.email}
                                </span>
                              )}
                              {member.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="text-sm text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
                    </h3>
                    <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          placeholder="Dr. John Doe"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Designation & Department */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation
                          </label>
                          <select
                            value={formData.designation}
                            onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            {DESIGNATIONS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                          </label>
                          <select
                            value={formData.department}
                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            {COMMON_DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Qualification */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qualification
                        </label>
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                          placeholder="Ph.D., M.Tech, B.Tech"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Specialization */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                          placeholder="Machine Learning, Data Science"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.experience_years}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                          placeholder="10"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="professor@college.edu"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Profile URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile URL
                        </label>
                        <input
                          type="url"
                          value={formData.profile_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, profile_url: e.target.value }))}
                          placeholder="https://college.edu/faculty/johndoe"
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

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingFaculty ? 'Update' : 'Create')}
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
