import axios from 'axios'

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  login: (email, password) => api.post('/admin/auth/login', { email, password }),
  getProfile: () => api.get('/admin/auth/me'),
  logout: () => api.post('/admin/auth/logout'),
}

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentActivity: (params) => api.get('/admin/dashboard/recent-activity', { params }),
  getAnalytics: (params) => api.get('/admin/dashboard/analytics', { params }),
}

// User Management API calls
export const userAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  sendOTP: (id) => api.post(`/admin/users/${id}/send-otp`),
  exportUsers: (params) => api.get('/admin/users/export', { params, responseType: 'blob' }),
  bulkUpdateStatus: (user_ids, status) => api.post('/admin/users/bulk-status', { user_ids, status }),
  // Role management
  getAllRoles: () => api.get('/admin/users/roles'),
  assignRole: (id, role_id) => api.post(`/admin/users/${id}/roles`, { role_id }),
  removeRole: (id, role_id) => api.delete(`/admin/users/${id}/roles/${role_id}`),
  // Activity logs
  getUserActivity: (id, params) => api.get(`/admin/users/${id}/activity`, { params }),
  // Password reset
  initiatePasswordReset: (id) => api.post(`/admin/users/${id}/reset-password`),
}

// College Management API calls
export const collegeAPI = {
  getColleges: (params) => api.get('/admin/colleges', { params }),
  getCollege: (id) => api.get(`/admin/colleges/${id}`),
  createCollege: (data) => api.post('/admin/colleges', data),
  updateCollege: (id, data) => api.put(`/admin/colleges/${id}`, data),
  deleteCollege: (id) => api.delete(`/admin/colleges/${id}`),
  updateCollegeStatus: (id, status) => api.put(`/admin/colleges/${id}/status`, { status }),
  bulkUpdateStatus: (college_ids, status) => api.post('/admin/colleges/bulk-status', { college_ids, status }),
  getFilterOptions: () => api.get('/admin/colleges/filter-options'),
}

// Course Management API calls
export const courseAPI = {
  getCourses: (params) => api.get('/admin/courses', { params }),
  getCourse: (id) => api.get(`/admin/courses/${id}`),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  updateCourseStatus: (id, status) => api.put(`/admin/courses/${id}/status`, { status }),
  bulkUpdateStatus: (course_ids, status) => api.post('/admin/courses/bulk-status', { course_ids, status }),
  getFilterOptions: () => api.get('/admin/courses/filter-options'),
}

// Exam Management API calls
export const examAPI = {
  getExams: (params) => api.get('/admin/exams', { params }),
  getExam: (id) => api.get(`/admin/exams/${id}`),
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (id, data) => api.put(`/admin/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/admin/exams/${id}`),
  updateExamStatus: (id, status) => api.put(`/admin/exams/${id}/status`, { status }),
  bulkUpdateStatus: (exam_ids, status) => api.post('/admin/exams/bulk-status', { exam_ids, status }),
}

// Scholarship Management API calls
export const scholarshipAPI = {
  getScholarships: (params) => api.get('/admin/scholarships', { params }),
  getScholarship: (id) => api.get(`/admin/scholarships/${id}`),
  createScholarship: (data) => api.post('/admin/scholarships', data),
  updateScholarship: (id, data) => api.put(`/admin/scholarships/${id}`, data),
  deleteScholarship: (id) => api.delete(`/admin/scholarships/${id}`),
  updateScholarshipStatus: (id, status) => api.put(`/admin/scholarships/${id}/status`, { status }),
  bulkUpdateStatus: (scholarship_ids, status) => api.post('/admin/scholarships/bulk-status', { scholarship_ids, status }),
}

// Placement Management API calls
export const placementAPI = {
  getPlacements: (params) => api.get('/admin/placements', { params }),
  getPlacement: (id) => api.get(`/admin/placements/${id}`),
  createPlacement: (data) => api.post('/admin/placements', data),
  updatePlacement: (id, data) => api.put(`/admin/placements/${id}`, data),
  deletePlacement: (id) => api.delete(`/admin/placements/${id}`),
  getPlacementStatsByCollege: (college_id) => api.get(`/admin/placements/stats/${college_id}`),
}

// Review Management API calls
export const reviewAPI = {
  getReviews: (params) => api.get('/admin/reviews', { params }),
  getReview: (id) => api.get(`/admin/reviews/${id}`),
  updateReviewStatus: (id, status) => api.put(`/admin/reviews/${id}/status`, { status }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  replyToReview: (id, reply) => api.post(`/admin/reviews/${id}/reply`, { reply }),
  getReviewStats: (params) => api.get('/admin/reviews/stats', { params }),
  bulkUpdateStatus: (review_ids, status) => api.post('/admin/reviews/bulk-status', { review_ids, status }),
  bulkDeleteReviews: (review_ids) => api.post('/admin/reviews/bulk-delete', { review_ids }),
}

// FAQ Management API calls
export const faqAPI = {
  getFaqs: (params) => api.get('/admin/faqs', { params }),
  getFaq: (id) => api.get(`/admin/faqs/${id}`),
  createFaq: (data) => api.post('/admin/faqs', data),
  updateFaq: (id, data) => api.put(`/admin/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/admin/faqs/${id}`),
  getCategories: () => api.get('/admin/faqs/categories'),
  reorderFaqs: (faqs) => api.post('/admin/faqs/reorder', { faqs }),
}

// News/Blog Management API calls
export const newsAPI = {
  getNewsArticles: (params) => api.get('/admin/news', { params }),
  getNewsArticle: (id) => api.get(`/admin/news/${id}`),
  createNewsArticle: (data) => api.post('/admin/news', data),
  updateNewsArticle: (id, data) => api.put(`/admin/news/${id}`, data),
  deleteNewsArticle: (id) => api.delete(`/admin/news/${id}`),
  getCategories: () => api.get('/admin/news/categories'),
  getStats: () => api.get('/admin/news/stats'),
  bulkUpdateStatus: (article_ids, status) => api.post('/admin/news/bulk-status', { article_ids, status }),
}

// Banner Management API calls
export const bannerAPI = {
  getBanners: (params) => api.get('/admin/banners', { params }),
  getBanner: (id) => api.get(`/admin/banners/${id}`),
  createBanner: (data) => api.post('/admin/banners', data),
  updateBanner: (id, data) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),
  getPlacements: () => api.get('/admin/banners/placements'),
  getPageTypes: () => api.get('/admin/banners/page-types'),
  getStats: () => api.get('/admin/banners/stats'),
  bulkUpdateStatus: (banner_ids, is_active) => api.post('/admin/banners/bulk-status', { banner_ids, is_active }),
}

// Upload API calls
export const uploadAPI = {
  uploadBannerImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/admin/upload/banner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteBannerImage: (filename) => api.delete(`/admin/upload/banner/${filename}`),
}

// Settings Management API calls
export const settingsAPI = {
  getSettings: (params) => api.get('/admin/settings', { params }),
  getSettingByKey: (key) => api.get(`/admin/settings/${key}`),
  updateSetting: (key, setting_value) => api.put(`/admin/settings/${key}`, { setting_value }),
  bulkUpdateSettings: (settings) => api.put('/admin/settings/bulk', { settings }),
  createSetting: (data) => api.post('/admin/settings', data),
  deleteSetting: (key) => api.delete(`/admin/settings/${key}`),
  getCategories: () => api.get('/admin/settings/categories'),
  getPublicSettings: () => api.get('/admin/settings/public'),
}

// Content Authors API calls
export const authorAPI = {
  getAuthors: (params) => api.get('/admin/authors', { params }),
  getAuthorsList: () => api.get('/admin/authors/list'),
  getAuthor: (id) => api.get(`/admin/authors/${id}`),
  createAuthor: (formData) => api.post('/admin/authors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateAuthor: (id, formData) => api.put(`/admin/authors/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAuthor: (id) => api.delete(`/admin/authors/${id}`),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/admin/authors/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// College Content (CMS) API calls
export const contentAPI = {
  // Get all sections for a college
  getAllContent: (collegeId) => api.get(`/admin/colleges/${collegeId}/content`),
  // Get specific section
  getSection: (collegeId, section) => api.get(`/admin/colleges/${collegeId}/content/${section}`),
  // Update/create section content
  updateSection: (collegeId, section, data) => api.put(`/admin/colleges/${collegeId}/content/${section}`, data),
  // Get valid section types
  getSectionTypes: () => api.get('/admin/content/sections'),
}

// College Updates (Key Updates/News) API calls
export const updatesAPI = {
  getUpdates: (collegeId, params) => api.get(`/admin/colleges/${collegeId}/updates`, { params }),
  getUpdate: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/updates/${id}`),
  createUpdate: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/updates`, data),
  updateUpdate: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/updates/${id}`, data),
  deleteUpdate: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/updates/${id}`),
  togglePin: (collegeId, id) => api.put(`/admin/colleges/${collegeId}/updates/${id}/pin`),
}

// College Cutoffs API calls
export const cutoffAPI = {
  getCutoffs: (collegeId, params) => api.get(`/admin/colleges/${collegeId}/cutoffs`, { params }),
  getCutoff: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/cutoffs/${id}`),
  createCutoff: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/cutoffs`, data),
  updateCutoff: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/cutoffs/${id}`, data),
  deleteCutoff: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/cutoffs/${id}`),
  bulkCreateCutoffs: (collegeId, cutoffs) => api.post(`/admin/colleges/${collegeId}/cutoffs/bulk`, { cutoffs }),
  getFilterOptions: (collegeId) => api.get(`/admin/colleges/${collegeId}/cutoffs/filters`),
}

// College Rankings API calls
export const rankingAPI = {
  getRankings: (collegeId, params) => api.get(`/admin/colleges/${collegeId}/rankings`, { params }),
  getRanking: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/rankings/${id}`),
  createRanking: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/rankings`, data),
  updateRanking: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/rankings/${id}`, data),
  deleteRanking: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/rankings/${id}`),
  bulkCreateRankings: (collegeId, rankings) => api.post(`/admin/colleges/${collegeId}/rankings/bulk`, { rankings }),
  getFilterOptions: (collegeId) => api.get(`/admin/colleges/${collegeId}/rankings/filters`),
}

// College Hostels API calls
export const hostelAPI = {
  getHostels: (collegeId) => api.get(`/admin/colleges/${collegeId}/hostels`),
  getHostel: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/hostels/${id}`),
  createHostel: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/hostels`, data),
  updateHostel: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/hostels/${id}`, data),
  deleteHostel: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/hostels/${id}`),
}

// College Faculty API calls
export const facultyAPI = {
  getFaculty: (collegeId, params) => api.get(`/admin/colleges/${collegeId}/faculty`, { params }),
  getFacultyMember: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/faculty/${id}`),
  createFaculty: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/faculty`, data),
  updateFaculty: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/faculty/${id}`, data),
  deleteFaculty: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/faculty/${id}`),
}

// Placement Recruiters API calls
export const recruiterAPI = {
  getRecruiters: (placementId) => api.get(`/admin/placements/${placementId}/recruiters`),
  getRecruiter: (placementId, id) => api.get(`/admin/placements/${placementId}/recruiters/${id}`),
  createRecruiter: (placementId, data) => api.post(`/admin/placements/${placementId}/recruiters`, data),
  updateRecruiter: (placementId, id, data) => api.put(`/admin/placements/${placementId}/recruiters/${id}`, data),
  deleteRecruiter: (placementId, id) => api.delete(`/admin/placements/${placementId}/recruiters/${id}`),
  bulkCreateRecruiters: (placementId, recruiters) => api.post(`/admin/placements/${placementId}/recruiters/bulk`, { recruiters }),
  getSectorOptions: () => api.get('/admin/placements/sectors'),
}

// College Gallery API calls
export const galleryAPI = {
  getGallery: (collegeId, params) => api.get(`/admin/colleges/${collegeId}/gallery`, { params }),
  getImage: (collegeId, id) => api.get(`/admin/colleges/${collegeId}/gallery/${id}`),
  createImage: (collegeId, data) => api.post(`/admin/colleges/${collegeId}/gallery`, data),
  updateImage: (collegeId, id, data) => api.put(`/admin/colleges/${collegeId}/gallery/${id}`, data),
  deleteImage: (collegeId, id) => api.delete(`/admin/colleges/${collegeId}/gallery/${id}`),
  reorderGallery: (collegeId, images) => api.post(`/admin/colleges/${collegeId}/gallery/reorder`, { images }),
  getCategories: (collegeId) => api.get(`/admin/colleges/${collegeId}/gallery/categories`),
}

export default api
