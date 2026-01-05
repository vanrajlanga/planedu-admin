'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collegeAPI, cutoffAPI, examAPI, courseAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import CollegeSubNav from '@/app/components/CollegeSubNav'
import SectionContentEditor from '@/app/components/SectionContentEditor'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'General', 'OBC', 'OBC-NCL', 'SC', 'ST', 'EWS',
  'General-PwD', 'OBC-PwD', 'SC-PwD', 'ST-PwD', 'EWS-PwD'
]

const CUTOFF_TYPES = [
  { value: 'Rank', label: 'Rank' },
  { value: 'Score', label: 'Score/Marks' },
  { value: 'Percentile', label: 'Percentile' },
]

const ACADEMIC_YEARS = (() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(`${i}`)
  }
  return years
})()

export default function CutoffsPage() {
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [cutoffs, setCutoffs] = useState([])
  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCutoff, setEditingCutoff] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Filters
  const [filterExam, setFilterExam] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [formData, setFormData] = useState({
    exam_id: '',
    course_id: '',
    academic_year: '',
    category: '',
    cutoff_type: 'Rank',
    cutoff_value: '',
    opening_rank: '',
    closing_rank: '',
    round: '1',
    specialization: '',
  })

  useEffect(() => {
    fetchData()
  }, [collegeId])

  useEffect(() => {
    if (collegeId) {
      fetchCutoffs()
    }
  }, [collegeId, filterExam, filterYear, filterCategory])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [collegeRes, examsRes, coursesRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        examAPI.getExams({ limit: 100 }),
        courseAPI.getCourses({ college_id: collegeId, limit: 100 }),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (examsRes.data.success) {
        setExams(examsRes.data.data || [])
      }

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCutoffs = async () => {
    try {
      const params = {}
      if (filterExam) params.exam_id = filterExam
      if (filterYear) params.academic_year = filterYear
      if (filterCategory) params.category = filterCategory

      const response = await cutoffAPI.getCutoffs(collegeId, params)
      if (response.data.success) {
        setCutoffs(response.data.data?.cutoffs || [])
      }
    } catch (error) {
      console.error('Failed to fetch cutoffs:', error)
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
    setEditingCutoff(null)
    setFormData({
      exam_id: exams.length > 0 ? exams[0].exam_id : '',
      course_id: '',
      academic_year: ACADEMIC_YEARS[0],
      category: 'General',
      cutoff_type: 'Rank',
      cutoff_value: '',
      opening_rank: '',
      closing_rank: '',
      round: '1',
      specialization: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cutoff) => {
    setEditingCutoff(cutoff)
    setFormData({
      exam_id: cutoff.exam_id || '',
      course_id: cutoff.course_id || '',
      academic_year: cutoff.academic_year || '',
      category: cutoff.category || 'General',
      cutoff_type: cutoff.cutoff_type || 'Rank',
      cutoff_value: cutoff.cutoff_value || '',
      opening_rank: cutoff.opening_rank || '',
      closing_rank: cutoff.closing_rank || '',
      round: cutoff.round || '1',
      specialization: cutoff.specialization || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.exam_id || !formData.academic_year || !formData.category) {
      toast.error('Exam, academic year, and category are required')
      return
    }

    try {
      setSaving(true)

      const dataToSave = {
        exam_id: parseInt(formData.exam_id),
        course_id: formData.course_id ? parseInt(formData.course_id) : null,
        academic_year: formData.academic_year,
        category: formData.category,
        cutoff_type: formData.cutoff_type || null,
        cutoff_value: formData.cutoff_value ? parseFloat(formData.cutoff_value) : null,
        opening_rank: formData.opening_rank ? parseInt(formData.opening_rank) : null,
        closing_rank: formData.closing_rank ? parseInt(formData.closing_rank) : null,
        round: formData.round ? parseInt(formData.round) : 1,
        specialization: formData.specialization || null,
      }

      if (editingCutoff) {
        const response = await cutoffAPI.updateCutoff(collegeId, editingCutoff.cutoff_id, dataToSave)
        if (response.data.success) {
          toast.success('Cutoff updated successfully')
          fetchCutoffs()
        }
      } else {
        const response = await cutoffAPI.createCutoff(collegeId, dataToSave)
        if (response.data.success) {
          toast.success('Cutoff created successfully')
          fetchCutoffs()
        }
      }

      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save cutoff:', error)
      toast.error(error.response?.data?.message || 'Failed to save cutoff')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cutoffId) => {
    try {
      const response = await cutoffAPI.deleteCutoff(collegeId, cutoffId)
      if (response.data.success) {
        toast.success('Cutoff deleted successfully')
        fetchCutoffs()
      }
    } catch (error) {
      console.error('Failed to delete cutoff:', error)
      toast.error('Failed to delete cutoff')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const groupCutoffsByExamAndYear = () => {
    const grouped = {}
    cutoffs.forEach(cutoff => {
      const key = `${cutoff.exam_name || 'Unknown Exam'}-${cutoff.academic_year}`
      if (!grouped[key]) {
        grouped[key] = {
          exam_name: cutoff.exam_name,
          exam_short_name: cutoff.exam_short_name,
          academic_year: cutoff.academic_year,
          cutoffs: []
        }
      }
      grouped[key].cutoffs.push(cutoff)
    })
    return Object.values(grouped)
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

  const groupedCutoffs = groupCutoffsByExamAndYear()

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
                  <h2 className="text-xl font-semibold text-gray-900">Cutoff Management</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage exam cutoffs for {college.college_name}
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Cutoff
                </button>
              </div>

              {/* Filters */}
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exam</label>
                  <select
                    value={filterExam}
                    onChange={(e) => setFilterExam(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Exams</option>
                    {exams.map(exam => (
                      <option key={exam.exam_id} value={exam.exam_id}>
                        {exam.short_name || exam.exam_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Years</option>
                    {ACADEMIC_YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {(filterExam || filterYear || filterCategory) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterExam('')
                        setFilterYear('')
                        setFilterCategory('')
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor Section */}
            <SectionContentEditor
              collegeId={collegeId}
              sectionType="cutoff"
              sectionLabel="Cutoffs"
              collegeName={college.college_name}
            />

            {/* Cutoffs Display */}
            {cutoffs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cutoff data</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding cutoff data for this college.</p>
                <div className="mt-6">
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Cutoff
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedCutoffs.map((group, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {group.exam_short_name || group.exam_name}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            Year: {group.academic_year}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {group.cutoffs.length} entries
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Round
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Opening Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Closing Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cutoff Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.cutoffs.map((cutoff) => (
                            <tr key={cutoff.cutoff_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cutoff.category === 'General' ? 'bg-blue-100 text-blue-800' :
                                  cutoff.category === 'OBC' || cutoff.category === 'OBC-NCL' ? 'bg-yellow-100 text-yellow-800' :
                                  cutoff.category === 'SC' ? 'bg-green-100 text-green-800' :
                                  cutoff.category === 'ST' ? 'bg-purple-100 text-purple-800' :
                                  cutoff.category === 'EWS' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {cutoff.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                Round {cutoff.round || 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {cutoff.opening_rank || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {cutoff.closing_rank || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {cutoff.cutoff_value ? (
                                  <span>
                                    {cutoff.cutoff_value}
                                    {cutoff.cutoff_type === 'Percentile' ? ' %ile' :
                                     cutoff.cutoff_type === 'Score' ? ' marks' : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {cutoff.course_name || cutoff.specialization || 'All Courses'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openEditModal(cutoff)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Edit
                                </button>
                                {deleteConfirmId === cutoff.cutoff_id ? (
                                  <span className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => handleDelete(cutoff.cutoff_id)}
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
                                    onClick={() => setDeleteConfirmId(cutoff.cutoff_id)}
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
                  </div>
                ))}
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
                    {editingCutoff ? 'Edit Cutoff' : 'Add Cutoff Data'}
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
                      Exam <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="exam_id"
                      value={formData.exam_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Exam</option>
                      {exams.map(exam => (
                        <option key={exam.exam_id} value={exam.exam_id}>
                          {exam.short_name || exam.exam_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                    <select
                      name="round"
                      value={formData.round}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                      <option value="3">Round 3</option>
                      <option value="4">Round 4</option>
                      <option value="5">Round 5</option>
                      <option value="6">Round 6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Rank</label>
                    <input
                      type="number"
                      name="opening_rank"
                      value={formData.opening_rank}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Rank</label>
                    <input
                      type="number"
                      name="closing_rank"
                      value={formData.closing_rank}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cutoff Type</label>
                    <select
                      name="cutoff_type"
                      value={formData.cutoff_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {CUTOFF_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cutoff Value</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cutoff_value"
                      value={formData.cutoff_value}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={formData.cutoff_type === 'percentile' ? 'e.g., 99.50' : 'e.g., 150'}
                    />
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
                  {saving ? 'Saving...' : editingCutoff ? 'Update Cutoff' : 'Add Cutoff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
