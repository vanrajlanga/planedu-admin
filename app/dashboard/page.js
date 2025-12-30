'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dashboardAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Dashboard stats error:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card p-6 bg-primary-600 text-white border-primary-600">
          <h2 className="text-xl font-semibold mb-1">Welcome back, Admin!</h2>
          <p className="text-primary-100 text-sm">Here's what's happening with your platform today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats?.totals?.users || 0}
            change="+12.5%"
            changeType="increase"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Total Colleges"
            value={stats?.totals?.colleges || 0}
            change="+3.2%"
            changeType="increase"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Total Reviews"
            value={stats?.totals?.reviews || 0}
            change="+8.1%"
            changeType="increase"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
            gradient="from-amber-500 to-orange-500"
          />
          <StatCard
            title="Total Courses"
            value={stats?.totals?.courses || 0}
            change="+5.4%"
            changeType="increase"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            gradient="from-emerald-500 to-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* New Registrations */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">New Registrations</h3>
            <div className="grid grid-cols-3 gap-3">
              <RegCard
                label="Today"
                value={stats?.newRegistrations?.today || 0}
                color="blue"
              />
              <RegCard
                label="This Week"
                value={stats?.newRegistrations?.thisWeek || 0}
                color="purple"
              />
              <RegCard
                label="This Month"
                value={stats?.newRegistrations?.thisMonth || 0}
                color="indigo"
              />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="card p-6 bg-primary-600 text-white border-primary-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Sessions</h3>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.activeSessions || 0}</div>
            <p className="text-primary-100 text-sm">Currently logged in admins</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Users</h3>
              <button
                onClick={() => router.push('/users')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {stats?.recentUsers?.slice(0, 5).map((user) => (
                <div key={user.user_id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email || user.phone}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full flex-shrink-0">
                    {user.user_type}
                  </span>
                </div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <p className="text-center py-8 text-sm text-slate-400">No recent users</p>
              )}
            </div>
          </div>

          {/* Top Colleges */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Top Colleges</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {stats?.topColleges?.map((college, index) => (
                <div key={college.college_id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{college.college_name}</p>
                    <p className="text-xs text-slate-500 truncate">{college.city}, {college.state}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{college.review_count}</p>
                    <p className="text-xs text-slate-500">reviews</p>
                  </div>
                </div>
              ))}
              {(!stats?.topColleges || stats.topColleges.length === 0) && (
                <p className="text-center py-8 text-sm text-slate-400">No colleges yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ title, value, change, changeType, icon, gradient }) {
  const gradientClasses = {
    'from-blue-500 to-cyan-500': 'bg-blue-500',
    'from-purple-500 to-pink-500': 'bg-purple-500',
    'from-amber-500 to-orange-500': 'bg-amber-500',
    'from-emerald-500 to-teal-500': 'bg-emerald-500',
  }
  
  const bgColor = gradientClasses[gradient] || 'bg-primary-600'
  
  return (
    <div className="card-hover p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mb-2">{value.toLocaleString()}</p>
          {change && (
            <div className={`inline-flex items-center text-xs font-medium ${
              changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {changeType === 'increase' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
              {change} from last month
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center text-white flex-shrink-0 ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function RegCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    indigo: 'bg-primary-600',
  }

  return (
    <div className={`${colors[color]} rounded-lg p-4 text-white`}>
      <p className="text-xs font-medium text-white/90 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
