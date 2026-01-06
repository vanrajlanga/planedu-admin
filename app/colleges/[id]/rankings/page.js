'use client'

import { useState, useEffect, use } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import CollegeSubNav from '../../../components/CollegeSubNav'
import { rankingAPI, collegeAPI } from '../../../../lib/api'

// Common ranking categories
const RANKING_CATEGORIES = [
  'Overall',
  'Engineering',
  'Management',
  'Pharmacy',
  'Medical',
  'Law',
  'Architecture',
  'Arts & Science',
  'Research',
  'Innovation',
]

export default function RankingsPage({ params }) {
  const resolvedParams = use(params)
  const collegeId = resolvedParams.id

  const [college, setCollege] = useState(null)
  const [rankings, setRankings] = useState([])
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRanking, setEditingRanking] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    agency_id: '',
    ranking_year: '',
  })
  const [availableYears, setAvailableYears] = useState([])

  // Form state
  const [formData, setFormData] = useState({
    agency_id: '',
    ranking_year: new Date().getFullYear(),
    category: '',
    rank_position: '',
    score: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [collegeId])

  useEffect(() => {
    if (collegeId) {
      fetchRankings()
    }
  }, [collegeId, filters])

  const fetchInitialData = async () => {
    try {
      const [collegeRes, filtersRes] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        rankingAPI.getFilterOptions(collegeId),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (filtersRes.data.success) {
        setAgencies(filtersRes.data.data.agencies || [])
        setAvailableYears(filtersRes.data.data.ranking_years || [])
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load data')
    }
  }

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const response = await rankingAPI.getRankings(collegeId, {
        ...filters,
        limit: 100,
      })

      if (response.data.success) {
        setRankings(response.data.data.rankings || [])
      }
    } catch (err) {
      console.error('Error fetching rankings:', err)
      setError('Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormData({
      agency_id: '',
      ranking_year: new Date().getFullYear(),
      category: '',
      rank_position: '',
      score: '',
    })
    setEditingRanking(null)
  }

  const handleOpenModal = (ranking = null) => {
    if (ranking) {
      setEditingRanking(ranking)
      setFormData({
        agency_id: ranking.agency_id || '',
        ranking_year: ranking.ranking_year || new Date().getFullYear(),
        category: ranking.category || '',
        rank_position: ranking.rank_position || '',
        score: ranking.score || '',
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
        agency_id: parseInt(formData.agency_id),
        ranking_year: parseInt(formData.ranking_year),
        category: formData.category || null,
        rank_position: formData.rank_position ? parseInt(formData.rank_position) : null,
        score: formData.score ? parseFloat(formData.score) : null,
      }

      let response
      if (editingRanking) {
        response = await rankingAPI.updateRanking(collegeId, editingRanking.ranking_id, data)
      } else {
        response = await rankingAPI.createRanking(collegeId, data)
      }

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: editingRanking ? 'Ranking updated successfully' : 'Ranking created successfully',
        })
        handleCloseModal()
        fetchRankings()
        fetchInitialData() // Refresh filter options
      }
    } catch (err) {
      console.error('Error saving ranking:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save ranking',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ranking) => {
    if (!confirm(`Delete ${ranking.agency_name} ${ranking.ranking_year} ranking?`)) {
      return
    }

    try {
      const response = await rankingAPI.deleteRanking(collegeId, ranking.ranking_id)

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: 'Ranking deleted successfully',
        })
        fetchRankings()
      }
    } catch (err) {
      console.error('Error deleting ranking:', err)
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete ranking',
      })
    }
  }

  // Group rankings by agency and year
  const groupedRankings = rankings.reduce((acc, ranking) => {
    const key = `${ranking.agency_name}-${ranking.ranking_year}`
    if (!acc[key]) {
      acc[key] = {
        agency_name: ranking.agency_name,
        agency_code: ranking.agency_code,
        ranking_year: ranking.ranking_year,
        items: [],
      }
    }
    acc[key].items.push(ranking)
    return acc
  }, {})

  // Generate year options (last 10 years + next year)
  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear + 1; y >= currentYear - 10; y--) {
    yearOptions.push(y)
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
            <p className="text-sm text-gray-500">Manage college rankings from various agencies</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Ranking
          </button>
        </div>

        {/* Sub Navigation */}
        <CollegeSubNav collegeId={collegeId} activeTab="rankings" />

        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {status.message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
              <select
                value={filters.agency_id}
                onChange={(e) => handleFilterChange('agency_id', e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">All Agencies</option>
                {agencies.map((agency) => (
                  <option key={agency.agency_id} value={agency.agency_id}>
                    {agency.agency_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={filters.ranking_year}
                onChange={(e) => handleFilterChange('ranking_year', e.target.value)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {(filters.agency_id || filters.ranking_year) && (
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ agency_id: '', ranking_year: '' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rankings List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a ranking from NIRF, QS, or other agencies.
            </p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Ranking
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRankings)
              .sort((a, b) => b[1].ranking_year - a[1].ranking_year)
              .map(([key, group]) => (
                <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                          <span className="text-sm font-medium text-blue-700">{group.agency_code}</span>
                        </span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{group.agency_name}</h3>
                          <p className="text-sm text-gray-500">{group.ranking_year}</p>
                        </div>
                      </div>
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
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.items.map((ranking) => (
                          <tr key={ranking.ranking_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.category || 'Overall'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {ranking.rank_position ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  #{ranking.rank_position}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.score ? parseFloat(ranking.score).toFixed(2) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleOpenModal(ranking)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(ranking)}
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
                      {editingRanking ? 'Edit Ranking' : 'Add Ranking'}
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
                      {/* Agency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ranking Agency *
                        </label>
                        <select
                          value={formData.agency_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, agency_id: e.target.value }))}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select Agency</option>
                          {agencies.map((agency) => (
                            <option key={agency.agency_id} value={agency.agency_id}>
                              {agency.agency_name} ({agency.agency_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ranking Year *
                        </label>
                        <select
                          value={formData.ranking_year}
                          onChange={(e) => setFormData(prev => ({ ...prev, ranking_year: e.target.value }))}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Overall</option>
                          {RANKING_CATEGORIES.filter(c => c !== 'Overall').map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rank and Score */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rank Position
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.rank_position}
                            onChange={(e) => setFormData(prev => ({ ...prev, rank_position: e.target.value }))}
                            placeholder="e.g., 5"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Score
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.score}
                            onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                            placeholder="e.g., 85.50"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
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
                    {saving ? 'Saving...' : (editingRanking ? 'Update' : 'Create')}
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
