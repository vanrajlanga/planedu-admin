'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/AdminLayout'
import { reviewAPI, collegeAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState([])
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [selectedReviews, setSelectedReviews] = useState([])
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    college_id: '',
    status: '',
    min_rating: '',
    max_rating: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchReviews()
    fetchColleges()
    fetchStats()
  }, [pagination.page, filters])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }
      const response = await reviewAPI.getReviews(params)
      if (response.data.success) {
        setReviews(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }))
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const response = await collegeAPI.getColleges({ limit: 1000, status: 'active' })
      if (response.data.success) {
        setColleges(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error)
      setColleges([])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await reviewAPI.getReviewStats()
      if (response.data.success) {
        setStats(response.data.data.statistics)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleViewDetails = async (review) => {
    try {
      const response = await reviewAPI.getReview(review.review_id)
      if (response.data.success) {
        setSelectedReview(response.data.data)
        setReplyText(response.data.data.admin_reply || '')
        setShowModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch review details:', error)
      toast.error('Failed to load review details')
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusUpdate = async (reviewId, status) => {
    try {
      const response = await reviewAPI.updateReviewStatus(reviewId, status)
      if (response.data.success) {
        toast.success(`Review ${status}`)
        fetchReviews()
        fetchStats()
        if (selectedReview && selectedReview.review_id === reviewId) {
          setSelectedReview({ ...selectedReview, status })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update review status')
    }
  }

  const handleBulkStatusUpdate = async (status) => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first')
      return
    }

    try {
      const response = await reviewAPI.bulkUpdateStatus(selectedReviews, status)
      if (response.data.success) {
        toast.success(`${selectedReviews.length} review(s) updated to ${status}`)
        setSelectedReviews([])
        fetchReviews()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to bulk update:', error)
      toast.error('Failed to update reviews')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedReviews.length} review(s)?`)) {
      return
    }

    try {
      const response = await reviewAPI.bulkDeleteReviews(selectedReviews)
      if (response.data.success) {
        toast.success(`${selectedReviews.length} review(s) deleted`)
        setSelectedReviews([])
        fetchReviews()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error)
      toast.error('Failed to delete reviews')
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    try {
      setSubmittingReply(true)
      const response = await reviewAPI.replyToReview(selectedReview.review_id, replyText)
      if (response.data.success) {
        toast.success('Reply posted successfully')
        setSelectedReview({ ...selectedReview, admin_reply: replyText })
        fetchReviews()
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      const response = await reviewAPI.deleteReview(reviewId)
      if (response.data.success) {
        toast.success('Review deleted successfully')
        setShowModal(false)
        fetchReviews()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to delete review:', error)
      toast.error('Failed to delete review')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReviews(reviews.map(r => r.review_id))
    } else {
      setSelectedReviews([])
    }
  }

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev => {
      if (prev.includes(reviewId)) {
        return prev.filter(id => id !== reviewId)
      } else {
        return [...prev, reviewId]
      }
    })
  }

  const getRatingStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="text-yellow-400">★</span>)
      } else {
        stars.push(<span key={i} className="text-gray-300">★</span>)
      }
    }
    return stars
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reviews Management</h1>
            <p className="text-slate-600 mt-1">Moderate and manage user reviews</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-slate-600">Total Reviews</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_reviews}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_reviews}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved_reviews}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-600">Average Rating</p>
              <p className="text-2xl font-bold text-slate-900">{stats.average_rating || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
              <input
                type="text"
                name="search"
                placeholder="Search reviews..."
                value={filters.search}
                onChange={handleFilterChange}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Rating</label>
              <select
                name="min_rating"
                value={filters.min_rating}
                onChange={handleFilterChange}
                className="input-base"
              >
                <option value="">Any Rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
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
                <option value="created_at">Date</option>
                <option value="rating">Rating</option>
                <option value="helpful_count">Helpful Count</option>
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
        {selectedReviews.length > 0 && (
          <div className="card p-4 bg-primary-50 border border-primary-200">
            <div className="flex justify-between items-center">
              <span className="text-primary-900 font-medium">{selectedReviews.length} review(s) selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-slate-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <p className="mt-4 text-slate-600">No reviews found</p>
              <p className="text-sm text-slate-500 mt-1">Reviews will appear here once users submit them</p>
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
                          checked={selectedReviews.length === reviews.length && reviews.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Review
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {reviews.map(review => (
                      <tr key={review.review_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.review_id)}
                            onChange={() => handleSelectReview(review.review_id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{review.college_name}</div>
                            <div className="text-sm text-slate-500">{review.city}, {review.state}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{review.user_name}</div>
                            <div className="text-sm text-slate-500">{review.user_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {getRatingStars(review.rating)}
                            <span className="ml-2 text-sm text-slate-600">{review.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {review.title && (
                            <div className="font-medium text-slate-900 mb-1">{review.title}</div>
                          )}
                          <div className="text-sm text-slate-600 line-clamp-2">
                            {review.review_text || 'No review text'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(review.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleViewDetails(review)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            {review.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(review.review_id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(review.review_id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
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

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Review Details</h2>
                  <p className="text-primary-100 text-sm">Review ID: {selectedReview.review_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedReview.status)}
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-primary-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* College & User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">College Information</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-900">{selectedReview.college_name}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedReview.city}, {selectedReview.state}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">User Information</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-900">{selectedReview.user_name}</p>
                    <p className="text-sm text-slate-600 mt-1">{selectedReview.user_email}</p>
                    {selectedReview.user_phone && (
                      <p className="text-sm text-slate-600">{selectedReview.user_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Rating</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex text-2xl">{getRatingStars(selectedReview.rating)}</div>
                      <span className="text-2xl font-bold text-slate-900">{selectedReview.rating}/5</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Helpful Count: {selectedReview.helpful_count || 0}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Review Date</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-900">
                      {new Date(selectedReview.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {selectedReview.updated_at !== selectedReview.created_at && (
                      <p className="text-sm text-slate-600 mt-1">
                        Updated: {new Date(selectedReview.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Review Content</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                  {selectedReview.title && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Title</p>
                      <p className="font-medium text-slate-900 text-lg">{selectedReview.title}</p>
                    </div>
                  )}

                  {selectedReview.review_text && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Review</p>
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedReview.review_text}</p>
                    </div>
                  )}

                  {selectedReview.pros && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Pros</p>
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedReview.pros}</p>
                    </div>
                  )}

                  {selectedReview.cons && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Cons</p>
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedReview.cons}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Reply */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Admin Reply</h3>
                {selectedReview.admin_reply ? (
                  <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
                    <p className="text-slate-900 whitespace-pre-wrap mb-2">{selectedReview.admin_reply}</p>
                    <div className="text-sm text-slate-600">
                      Replied by: {selectedReview.replied_by_name || 'Admin'}
                      {selectedReview.replied_at && (
                        <span className="ml-2">
                          on {new Date(selectedReview.replied_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} className="space-y-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply to this review..."
                      rows="4"
                      className="input-base"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="btn-primary"
                    >
                      {submittingReply ? 'Posting Reply...' : 'Post Reply'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <div className="flex gap-3 flex-wrap">
                {selectedReview.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedReview.review_id, 'approved')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Review
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedReview.review_id, 'rejected')}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Review
                    </button>
                  </>
                )}

                {selectedReview.status === 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedReview.review_id, 'rejected')}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Reject Review
                  </button>
                )}

                {selectedReview.status === 'rejected' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedReview.review_id, 'approved')}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Review
                  </button>
                )}

                <button
                  onClick={() => handleDelete(selectedReview.review_id)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Delete Review
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
