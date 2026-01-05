'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { collegeAPI, contentAPI, updatesAPI, galleryAPI, facultyAPI, hostelAPI, placementAPI, recruiterAPI, cutoffAPI, rankingAPI, courseAPI, reviewAPI, faqAPI, newsAPI, userAPI } from '@/lib/api'

const SECTION_LABELS = {
  overview: 'Info',
  courses: 'Courses & Fees',
  admission: 'Admission',
  cutoff: 'Cutoff',
  placement: 'Placement',
  reviews: 'Reviews',
  department: 'Department',
  ranking: 'Ranking',
  gallery: 'Gallery',
  scholarship: 'Scholarship',
  faculty: 'Faculty',
  news: 'News & Articles',
  hostel: 'Hostel',
  qna: 'Q&A',
  compare: 'College Compare',
  profile: 'Profile',
}

function PreviewPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const collegeId = params.id
  const activeSection = searchParams.get('section') || 'overview'

  const [loading, setLoading] = useState(true)
  const [college, setCollege] = useState(null)
  const [contentData, setContentData] = useState({})
  const [updates, setUpdates] = useState([])
  const [gallery, setGallery] = useState([])
  const [faculty, setFaculty] = useState([])
  const [hostels, setHostels] = useState([])
  const [placements, setPlacements] = useState([])
  const [courses, setCourses] = useState([])
  const [cutoffs, setCutoffs] = useState([])
  const [rankings, setRankings] = useState([])
  const [reviews, setReviews] = useState([])
  const [faqs, setFaqs] = useState([])
  const [news, setNews] = useState([])
  const [similarColleges, setSimilarColleges] = useState([])
  const [students, setStudents] = useState([])
  const [showKeyUpdates, setShowKeyUpdates] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [collegeId])

  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Helper to safely fetch with fallback
      const safeFetch = async (promise, fallback = { data: { success: false } }) => {
        try {
          return await promise
        } catch (error) {
          console.warn('API call failed:', error.message)
          return fallback
        }
      }

      const [
        collegeRes, contentRes, updatesRes, galleryRes,
        facultyRes, hostelRes, placementRes, cutoffRes, rankingRes, courseRes,
        reviewRes, faqRes, newsRes
      ] = await Promise.all([
        collegeAPI.getCollege(collegeId),
        contentAPI.getAllContent(collegeId),
        safeFetch(updatesAPI.getUpdates(collegeId)),
        safeFetch(galleryAPI.getGallery(collegeId)),
        safeFetch(facultyAPI.getFaculty(collegeId)),
        safeFetch(hostelAPI.getHostels(collegeId)),
        safeFetch(placementAPI.getPlacementStatsByCollege(collegeId)),
        safeFetch(cutoffAPI.getCutoffs(collegeId)),
        safeFetch(rankingAPI.getRankings(collegeId)),
        safeFetch(courseAPI.getCourses({ college_id: collegeId })),
        safeFetch(reviewAPI.getReviews({ college_id: collegeId, status: 'approved' })),
        safeFetch(faqAPI.getFaqs({ is_active: 'true' })),
        safeFetch(newsAPI.getNewsArticles({ limit: 10 })),
      ])

      if (collegeRes.data.success) {
        setCollege(collegeRes.data.data)
      }

      if (contentRes.data.success) {
        const contentMap = {}
        const sections = contentRes.data.data?.sections || []
        sections.forEach((item) => {
          contentMap[item.section_type] = item
        })
        setContentData(contentMap)
      }

      if (updatesRes.data.success) {
        setUpdates(updatesRes.data.data?.updates || [])
      }

      if (galleryRes.data.success) {
        setGallery(galleryRes.data.data?.images || [])
      }

      if (facultyRes.data.success) {
        const facultyData = facultyRes.data.data?.faculty || facultyRes.data.data || []
        setFaculty(Array.isArray(facultyData) ? facultyData : [])
      }

      if (hostelRes.data.success) {
        const hostelData = hostelRes.data.data?.hostels || hostelRes.data.data || []
        setHostels(Array.isArray(hostelData) ? hostelData : [])
      }

      if (placementRes.data.success) {
        const placementData = placementRes.data.data?.placements || placementRes.data.data || []
        setPlacements(Array.isArray(placementData) ? placementData : [])
      }

      if (cutoffRes.data.success) {
        const cutoffData = cutoffRes.data.data?.cutoffs || cutoffRes.data.data || []
        setCutoffs(Array.isArray(cutoffData) ? cutoffData : [])
      }

      if (rankingRes.data.success) {
        const rankingData = rankingRes.data.data?.rankings || rankingRes.data.data || []
        setRankings(Array.isArray(rankingData) ? rankingData : [])
      }

      if (courseRes.data.success) {
        const courseData = courseRes.data.data?.courses || courseRes.data.data || []
        setCourses(Array.isArray(courseData) ? courseData : [])
      }

      if (reviewRes.data.success) {
        const reviewData = reviewRes.data.data?.reviews || reviewRes.data.data || []
        setReviews(Array.isArray(reviewData) ? reviewData : [])
      }

      if (faqRes.data.success) {
        const faqData = faqRes.data.data?.faqs || faqRes.data.data || []
        setFaqs(Array.isArray(faqData) ? faqData : [])
      }

      if (newsRes.data.success) {
        const newsData = newsRes.data.data?.articles || newsRes.data.data || []
        setNews(Array.isArray(newsData) ? newsData : [])
      }

      // Fetch similar colleges for comparison
      if (collegeRes.data.success) {
        try {
          const similarRes = await collegeAPI.getColleges({
            college_type: collegeRes.data.data.college_type,
            limit: 10,
          })
          if (similarRes.data.success) {
            const colleges = similarRes.data.data?.colleges || similarRes.data.data || []
            // Filter out the current college (compare as strings for safety)
            setSimilarColleges(colleges.filter(c =>
              String(c.college_id) !== String(collegeId) &&
              String(c.id) !== String(collegeId)
            ))
          }
        } catch (e) {
          console.warn('Failed to fetch similar colleges:', e.message)
        }
      }

      // Fetch students interested in this college (for Profile tab)
      try {
        const studentsRes = await userAPI.getUsers({
          user_type: 'student',
          limit: 20,
        })
        if (studentsRes.data.success) {
          const studentData = studentsRes.data.data?.users || studentsRes.data.data || []
          setStudents(Array.isArray(studentData) ? studentData : [])
        }
      } catch (e) {
        console.warn('Failed to fetch students:', e.message)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentContent = contentData[activeSection]
  // Author info now comes directly from content (joined with admin_users in backend)
  const currentAuthor = currentContent?.author_name ? {
    name: currentContent.author_name,
    designation: currentContent.author_designation || 'Content Writer',
    profile_image_url: currentContent.author_image
  } : null

  // Sections that have blog/article content and should show author details
  const sectionsWithContent = ['overview', 'courses', 'admission', 'cutoff', 'placement', 'scholarship']
  const shouldShowAuthor = sectionsWithContent.includes(activeSection) && currentContent?.content

  const keyUpdates = updates.filter((u) => u.update_type === 'key_update')
  const otherUpdates = updates.filter((u) => u.update_type !== 'key_update')

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'gallery':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {college.college_name} Photo Gallery
            </h1>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((image) => (
                  <div key={image.id} className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={image.image_url}
                      alt={image.caption || 'Gallery image'}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-white">
                      <span className="text-xs font-medium text-orange-600 capitalize">
                        {image.category}
                      </span>
                      {image.caption && (
                        <p className="mt-1 text-sm text-gray-700">{image.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No photos available yet.</p>
              </div>
            )}
          </div>
        )

      case 'faculty':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Faculty Members</h1>
            {faculty.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faculty.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {member.profile_image_url ? (
                        <img src={member.profile_image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-gray-500">{member.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.designation}</p>
                      {member.department && <p className="text-sm text-gray-500">{member.department}</p>}
                      {member.qualification && <p className="text-xs text-gray-400">{member.qualification}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {member.email && (
                          <span className="text-blue-600">{member.email}</span>
                        )}
                        {member.phone && (
                          <span className="text-gray-600">📞 {member.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No faculty information available.</p>
              </div>
            )}
          </div>
        )

      case 'courses':
        return (
          <div>
            {/* CMS Content - Blog section above structured data */}
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}
            {currentContent?.content && (
              <div
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Courses & Fees</h2>
            {courses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.course_id}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{course.course_name}</div>
                          {course.specialization && <div className="text-sm text-gray-500">{course.specialization}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{course.duration || 'N/A'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{formatCurrency(course.total_fees)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {course.application_start_date && course.application_end_date
                            ? `${formatDate(course.application_start_date)} - ${formatDate(course.application_end_date)}`
                            : 'N/A'}
                          {course.brochure_url && (
                            <a href={course.brochure_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-orange-600 hover:underline">
                              📄 Brochure
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No courses available.</p>
              </div>
            )}
          </div>
        )

      case 'placement':
        return (
          <div>
            {/* CMS Content - Blog section above structured data */}
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}
            {currentContent?.content && (
              <div
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Placement Statistics</h2>
            {placements.length > 0 ? (
              <div className="space-y-6">
                {placements.map((placement) => (
                  <div key={placement.placement_id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">
                      Placements {placement.academic_year}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{placement.students_placed || 'N/A'}</div>
                        <div className="text-xs text-gray-600">Students Placed</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(placement.highest_package)}</div>
                        <div className="text-xs text-gray-600">Highest Package</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(placement.average_package)}</div>
                        <div className="text-xs text-gray-600">Average Package</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{placement.total_companies || 'N/A'}</div>
                        <div className="text-xs text-gray-600">Companies Visited</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No placement data available.</p>
              </div>
            )}
          </div>
        )

      case 'hostel':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Hostel Facilities</h1>
            {hostels.length > 0 ? (
              <div className="space-y-4">
                {hostels.map((hostel) => (
                  <div key={hostel.hostel_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{hostel.hostel_name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        hostel.hostel_type === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {hostel.hostel_type === 'boys' ? 'Boys' : 'Girls'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Capacity:</span>
                        <span className="ml-1 font-medium">{hostel.capacity || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Room Type:</span>
                        <span className="ml-1 font-medium capitalize">{hostel.room_type || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Annual Fee:</span>
                        <span className="ml-1 font-medium">{formatCurrency(hostel.annual_fee)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mess Fee:</span>
                        <span className="ml-1 font-medium">{formatCurrency(hostel.mess_fee)}</span>
                      </div>
                    </div>
                    {hostel.amenities && (
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">Amenities: </span>
                        <span className="text-sm">{hostel.amenities}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No hostel information available.</p>
              </div>
            )}
          </div>
        )

      case 'ranking':
        return (
          <div>
            {/* CMS Content - Blog section above structured data */}
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}
            {currentContent?.content && (
              <div
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Rankings & Accreditations</h2>
            {rankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ranking Body</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankings.map((ranking) => (
                      <tr key={ranking.ranking_id}>
                        <td className="px-4 py-4 font-medium text-gray-900">{ranking.ranking_body}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{ranking.year}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                            #{ranking.rank}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{ranking.category || 'Overall'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No ranking data available.</p>
              </div>
            )}
          </div>
        )

      case 'cutoff':
        return (
          <div>
            {/* CMS Content - Blog section above structured data */}
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}
            {currentContent?.content && (
              <div
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Admission Cutoffs</h2>
            {cutoffs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cutoff</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cutoffs.map((cutoff) => (
                      <tr key={cutoff.cutoff_id}>
                        <td className="px-4 py-4 font-medium text-gray-900">{cutoff.exam_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{cutoff.course_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{cutoff.category || 'General'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{cutoff.year}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                            {cutoff.cutoff_value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No cutoff data available.</p>
              </div>
            )}
          </div>
        )

      case 'reviews':
        // Calculate average rating and rating distribution
        const avgRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length).toFixed(1)
          : '0.0'
        const ratingCounts = [0, 0, 0, 0, 0]
        reviews.forEach(r => {
          const rating = Math.round(r.overall_rating || 0)
          if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++
        })
        const maxCount = Math.max(...ratingCounts, 1)

        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{college?.college_name} Reviews</h1>

            {/* Rating Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Overall Rating */}
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{avgRating}</div>
                  <div className="flex items-center justify-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= Math.round(parseFloat(avgRating)) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">({reviews.length} Reviews)</div>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2 mb-1">
                      <span className="w-3 text-sm text-gray-600">{rating}</span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${(ratingCounts[rating - 1] / maxCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm text-gray-500 text-right">{ratingCounts[rating - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.review_id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-gray-500">
                          {review.user_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{review.user_name || 'Anonymous'}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-4 h-4 ${star <= Math.round(review.overall_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                        </div>
                        {review.title && <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>}
                        <p className="text-gray-700 text-sm">{review.review_text}</p>

                        {/* Likes/Dislikes */}
                        {(review.likes || review.dislikes) && (
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            {review.likes && (
                              <div className="bg-green-50 p-3 rounded">
                                <div className="text-xs font-medium text-green-700 mb-1">👍 Likes</div>
                                <p className="text-sm text-gray-700">{review.likes}</p>
                              </div>
                            )}
                            {review.dislikes && (
                              <div className="bg-red-50 p-3 rounded">
                                <div className="text-xs font-medium text-red-700 mb-1">👎 Dislikes</div>
                                <p className="text-sm text-gray-700">{review.dislikes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No reviews available yet.</p>
              </div>
            )}
          </div>
        )

      case 'news':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">News & Articles</h1>
            {news.length > 0 ? (
              <div className="space-y-4">
                {news.map((article) => (
                  <div key={article.article_id || article.id} className="border rounded-lg p-4 flex gap-4">
                    {article.featured_image_url && (
                      <div className="w-32 h-24 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-orange-600 cursor-pointer">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt || article.summary}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                        {article.category && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{article.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No news articles available.</p>
              </div>
            )}
          </div>
        )

      case 'qna':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Questions & Answers</h1>
            {faqs.length > 0 ? (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={faq.id || index} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <h3 className="font-medium text-gray-900 flex items-start gap-2">
                        <span className="text-orange-500 font-bold">Q:</span>
                        {faq.question}
                      </h3>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">A:</span>
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                      {faq.category && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {faq.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No Q&A available yet.</p>
              </div>
            )}
          </div>
        )

      case 'department':
        // Department is a CMS content section
        return (
          <div>
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}
            {currentContent?.content ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{college?.college_name} Departments</h1>
                <p>No department information available yet.</p>
                <Link
                  href={`/colleges/${collegeId}/content`}
                  className="text-orange-500 hover:underline mt-2 inline-block"
                >
                  Add content in the editor
                </Link>
              </div>
            )}
          </div>
        )

      case 'compare':
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Compare Popular Colleges With {college?.college_name}
            </h1>
            {similarColleges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarColleges.map((c) => (
                  <div key={c.college_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.college_name} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">{c.college_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{c.college_name}</h3>
                        <p className="text-sm text-gray-500">{c.city}, {c.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{c.avg_rating || 'N/A'}</span>
                        {c.total_reviews > 0 && (
                          <span className="text-gray-400">({c.total_reviews})</span>
                        )}
                      </div>
                      <span className="text-gray-500">{c.college_type}</span>
                    </div>
                    <button className="w-full py-2 px-4 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 text-sm font-medium">
                      Compare
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No similar colleges found for comparison.</p>
              </div>
            )}
          </div>
        )

      case 'profile':
        // Get unique course interests from students
        const courseInterests = [...new Set(students.map(s => s.target_course).filter(Boolean))]
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Students Interested in {college?.college_name}
            </h1>
            <p className="text-gray-600 mb-6">
              Connect with students who are interested in studying at this institution.
            </p>

            {/* Course Filter Chips */}
            {courseInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium">
                  All Courses
                </span>
                {courseInterests.map((course) => (
                  <span
                    key={course}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer"
                  >
                    {course}
                  </span>
                ))}
              </div>
            )}

            {/* Students Grid */}
            {students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <div key={student.user_id || student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {student.profile_photo_url ? (
                          <img
                            src={student.profile_photo_url}
                            alt={student.first_name || 'Student'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {(student.first_name || student.email || 'S').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {student.first_name && student.last_name
                            ? `${student.first_name} ${student.last_name}`
                            : student.first_name || student.email?.split('@')[0] || 'Student'}
                        </h3>
                        {(student.city || student.state) && (
                          <p className="text-sm text-gray-500">
                            {[student.city, student.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {student.current_education_level && (
                          <p className="text-xs text-gray-400 mt-1">
                            {student.current_education_level}
                          </p>
                        )}
                      </div>
                    </div>
                    {student.target_course && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-gray-500">Interested in:</span>
                        <span className="ml-1 text-sm font-medium text-orange-600">{student.target_course}</span>
                      </div>
                    )}
                    <button className="mt-3 w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900 mb-1">No student profiles yet</p>
                <p className="text-sm">Students interested in this college will appear here.</p>
              </div>
            )}
          </div>
        )

      default:
        // Regular CMS Content (overview, admission, scholarship)
        return (
          <>
            {currentContent?.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
            )}

            {currentContent?.content ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No content available for this section.</p>
                <Link
                  href={`/colleges/${collegeId}/content`}
                  className="text-orange-500 hover:underline mt-2 inline-block"
                >
                  Add content in the editor
                </Link>
              </div>
            )}

            {currentContent && (
              <div className="mt-6 pt-4 border-t">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentContent.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentContent.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            )}
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">College not found</p>
          <Link href="/colleges" className="text-orange-500 hover:underline">
            Back to Colleges
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Banner */}
      <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium sticky top-0 z-50">
        <span>Preview Mode</span>
        <Link
          href={`/colleges/${collegeId}/content`}
          className="ml-4 bg-black text-white px-3 py-1 rounded text-xs hover:bg-gray-800"
        >
          Back to Editor
        </Link>
      </div>

      {/* College Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start gap-6">
            {/* College Logo */}
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              {college.logo_url ? (
                <img
                  src={college.logo_url}
                  alt={college.college_name}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {college.college_name?.charAt(0)}
                </span>
              )}
            </div>

            {/* College Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                {college.college_name}: Fees, Admission 2026, Courses, Cutoff, Ranking, Placement
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>{college.city}, {college.state}</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {college.college_type}
                </span>
                {college.established_year && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Estd {college.established_year}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="text-right">
              <div className="text-3xl font-bold">{college.avg_rating || '4.0'}</div>
              <div className="flex items-center gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-300">({college.total_reviews || 0} Reviews)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-10 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/colleges/${collegeId}/preview?section=${key}`}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Column - Content */}
          <div className="flex-1 min-w-0">
            {/* Author Info - Only show on content sections */}
            {shouldShowAuthor && (
              <div className="bg-white rounded-lg p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {currentAuthor?.profile_image_url ? (
                    <img
                      src={currentAuthor.profile_image_url}
                      alt={currentAuthor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                      {currentAuthor?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-600">
                      {currentAuthor?.name || 'Content Team'}
                    </span>
                    {currentAuthor?.is_verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentAuthor?.designation || 'Content Writer'} | Updated on - {formatDate(currentContent?.updated_at)}
                  </div>
                </div>
              </div>
            )}

            {/* Key Updates Section */}
            {updates.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded"></span>
                  {college.college_name} Latest Updates and News
                </h2>

                {/* Toggle Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowKeyUpdates(true)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      showKeyUpdates
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Key Updates
                    {keyUpdates.length > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                        {keyUpdates.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowKeyUpdates(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      !showKeyUpdates
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Other Updates
                    {otherUpdates.length > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                        {otherUpdates.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Updates List */}
                <div className="space-y-3">
                  {(showKeyUpdates ? keyUpdates : otherUpdates).slice(0, 5).map((update) => (
                    <div key={update.id} className="text-sm">
                      <span className="text-orange-600 font-medium">{formatDate(update.published_at)}</span>
                      <span className="mx-2">-</span>
                      <span className="text-gray-800">{update.title}</span>
                      {update.source_url && (
                        <a href={update.source_url} className="text-blue-600 hover:underline ml-1">
                          Read News.
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-lg p-6">
              {renderSectionContent()}
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            {/* CTA Card */}
            <div className="bg-white rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Are You Interested in this College?
              </h3>
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 mb-3 flex items-center justify-center gap-2">
                Apply Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-900 flex items-center justify-center gap-2">
                Download Brochure
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Established</span>
                  <span className="font-medium">{college.established_year || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">{college.college_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ownership</span>
                  <span className="font-medium">{college.ownership}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-medium">{college.avg_rating || 'N/A'} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    }>
      <PreviewPageContent />
    </Suspense>
  )
}
