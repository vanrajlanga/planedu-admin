'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'
import { examAPI } from '@/lib/api'

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})

  // Filters
  const [search, setSearch] = useState('')
  const [examLevel, setExamLevel] = useState('')
  const [examMode, setExamMode] = useState('')
  const [isActive, setIsActive] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [formData, setFormData] = useState({
    exam_name: '',
    short_name: '',
    slug: '',
    exam_category: '',
    exam_level: '',
    exam_mode: '',
    conducting_body: '',
    official_website: '',
    description: '',
    is_active: true
  })

  const examLevels = ['National', 'State', 'University', 'International']
  const examModes = ['Online', 'Offline', 'Both']

  useEffect(() => {
    fetchExams()
  }, [search, examLevel, examMode, isActive])

  const fetchExams = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page: page.toString(),
        limit: '25',
        ...(search && { search }),
        ...(examLevel && { level: examLevel }),
        ...(examMode && { mode: examMode }),
        ...(isActive && { status: isActive })
      }

      const response = await examAPI.getExams(params)

      if (response.data.success) {
        setExams(response.data.data)
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          total: response.data.pagination.total,
          hasNext: response.data.pagination.page < response.data.pagination.pages,
          hasPrev: response.data.pagination.page > 1
        })
      }

    } catch (error) {
      console.error('Failed to fetch exams:', error)
      toast.error('Failed to load exams')
      setExams([])
      setPagination({ page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam)
      setFormData({
        exam_name: exam.exam_name || '',
        short_name: exam.short_name || '',
        slug: exam.slug || '',
        exam_category: exam.exam_category || '',
        exam_level: exam.exam_level || '',
        exam_mode: exam.exam_mode || '',
        conducting_body: exam.conducting_body || '',
        official_website: exam.official_website || '',
        description: exam.description || '',
        is_active: exam.is_active
      })
    } else {
      setEditingExam(null)
      setFormData({
        exam_name: '',
        short_name: '',
        slug: '',
        exam_category: '',
        exam_level: '',
        exam_mode: '',
        conducting_body: '',
        official_website: '',
        description: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExam(null)
    setFormData({
      exam_name: '',
      short_name: '',
      slug: '',
      exam_category: '',
      exam_level: '',
      exam_mode: '',
      conducting_body: '',
      official_website: '',
      description: '',
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

    if (!formData.exam_name || !formData.exam_level || !formData.exam_mode) {
      toast.error('Exam name, level, and mode are required')
      return
    }

    // Auto-generate slug if not provided
    const finalFormData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.exam_name)
    }

    try {
      if (editingExam) {
        await examAPI.updateExam(editingExam.exam_id, finalFormData)
        toast.success('Exam updated successfully')
      } else {
        await examAPI.createExam(finalFormData)
        toast.success('Exam created successfully')
      }

      handleCloseModal()
      fetchExams()
    } catch (error) {
      console.error('Failed to save exam:', error)
      toast.error(error.response?.data?.message || 'Failed to save exam')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) {
      return
    }

    try {
      await examAPI.deleteExam(id)
      toast.success('Exam deleted successfully')
      fetchExams()
    } catch (error) {
      console.error('Failed to delete exam:', error)
      toast.error('Failed to delete exam')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setExamLevel('')
    setExamMode('')
    setIsActive('')
  }

  return (
    <AdminLayout>
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exams Management</h1>
        <p className="text-gray-600 mt-1">Manage entrance examinations and competitive tests</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={examLevel}
            onChange={(e) => setExamLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            {examLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={examMode}
            onChange={(e) => setExamMode(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Modes</option>
            {examModes.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
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
            Add New Exam
          </button>
        </div>
      </div>

      {/* Exams List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No exams found</p>
          <p className="text-sm text-gray-400 mt-2">Click "Add New Exam" to create your first exam entry</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conducting Body</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam) => (
                    <tr key={exam.exam_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{exam.exam_name}</p>
                        <p className="text-xs text-gray-500">{exam.slug}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{exam.short_name || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exam.exam_category ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            {exam.exam_category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          exam.exam_level === 'National' ? 'bg-red-100 text-red-800' :
                          exam.exam_level === 'State' ? 'bg-blue-100 text-blue-800' :
                          exam.exam_level === 'University' ? 'bg-green-100 text-green-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {exam.exam_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {exam.exam_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{exam.conducting_body || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          exam.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(exam)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exam.exam_id)}
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
                Showing {exams.length} of {pagination.total} exams
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchExams(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchExams(pagination.page + 1)}
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
                {editingExam ? 'Edit Exam' : 'Create New Exam'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.exam_name}
                        onChange={(e) => setFormData({...formData, exam_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Joint Entrance Examination Main"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={formData.short_name}
                        onChange={(e) => setFormData({...formData, short_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., JEE Main"
                      />
                    </div>
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
                      placeholder="Auto-generated from exam name if left empty"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from exam name</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Category
                      </label>
                      <input
                        type="text"
                        value={formData.exam_category}
                        onChange={(e) => setFormData({...formData, exam_category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Engineering, Medical, MBA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conducting Body
                      </label>
                      <input
                        type="text"
                        value={formData.conducting_body}
                        onChange={(e) => setFormData({...formData, conducting_body: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., NTA, AIIMS"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.exam_level}
                        onChange={(e) => setFormData({...formData, exam_level: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select level</option>
                        {examLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.exam_mode}
                        onChange={(e) => setFormData({...formData, exam_mode: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select mode</option>
                        {examModes.map(mode => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Official Website
                    </label>
                    <input
                      type="url"
                      value={formData.official_website}
                      onChange={(e) => setFormData({...formData, official_website: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Enter exam description, eligibility, pattern, etc."
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
                    {editingExam ? 'Update Exam' : 'Create Exam'}
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
