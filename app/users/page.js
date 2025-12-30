'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { userAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [userType, setUserType] = useState(searchParams.get('user_type') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [limit] = useState(25)

  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [page, status, userType])

  const fetchUsers = async (searchTerm = search) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(status && { status }),
        ...(userType && { user_type: userType }),
      }

      const response = await userAPI.getUsers(params)
      if (response.data.success) {
        setUsers(response.data.data.users)
        setPagination(response.data.data.pagination)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
    fetchUsers(search)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    setUserType('')
    setPage(1)
    fetchUsers('')
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await userAPI.updateUserStatus(userId, newStatus)
      if (response.data.success) {
        // Update local state
        setUsers(users.map(u =>
          u.user_id === userId ? { ...u, status: newStatus } : u
        ))
        toast.success('User status updated successfully')
      }
    } catch (err) {
      console.error('Update status error:', err)
      toast.error('Failed to update user status')
    }
  }

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first')
      return
    }

    if (!confirm(`Update status to "${newStatus}" for ${selectedUsers.length} users?`)) {
      return
    }

    try {
      const response = await userAPI.bulkUpdateStatus(selectedUsers, newStatus)
      if (response.data.success) {
        toast.success(`${response.data.data.affected} users updated successfully`)
        setSelectedUsers([])
        fetchUsers()
      }
    } catch (err) {
      console.error('Bulk update error:', err)
      toast.error('Failed to update users')
    }
  }

  const handleExport = async () => {
    try {
      const params = {
        ...(status && { status }),
        ...(userType && { user_type: userType }),
      }

      const response = await userAPI.exportUsers(params)

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export users')
    }
  }

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.user_id))
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'badge-success'
      case 'inactive': return 'badge-neutral'
      case 'suspended': return 'badge-error'
      default: return 'badge-neutral'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600">Loading users...</p>
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
      <div className="space-y-4">
        {/* Filters and Search */}
        <div className="card p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by email, phone, or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-base pl-10"
                  />
                  <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-base"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* User Type Filter */}
              <div>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="input-base"
                >
                  <option value="">All Types</option>
                  <option value="student">Student</option>
                  <option value="counselor">Counselor</option>
                  <option value="institution">Institution</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="btn-primary"
              >
                Search
              </button>
              {(search || status || userType) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-ghost"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </form>

          {/* Active Filters Display */}
          {(search || status || userType) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {search && (
                <span className="badge-info">
                  Search: {search} 
                  <button 
                    onClick={() => { setSearch(''); fetchUsers(''); }} 
                    className="ml-1.5 font-bold hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {status && (
                <span className="badge-success">
                  Status: {status} 
                  <button 
                    onClick={() => { setStatus(''); fetchUsers(search); }} 
                    className="ml-1.5 font-bold hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {userType && (
                <span className="badge-info">
                  Type: {userType} 
                  <button 
                    onClick={() => { setUserType(''); fetchUsers(search); }} 
                    className="ml-1.5 font-bold hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="card p-4 bg-primary-50 border-primary-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {selectedUsers.length}
                </div>
                <span className="text-primary-900 font-semibold text-sm">
                  {selectedUsers.length === 1 ? '1 user selected' : `${selectedUsers.length} users selected`}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-all"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('suspended')}
                  className="btn-danger px-4 py-2 text-sm"
                >
                  Suspend
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-600">
            {pagination && (
              <span>
                Showing <span className="font-semibold text-slate-900">{users.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.total}</span> users
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-600 mb-4 text-sm font-medium">No users found</p>
              {(search || status || userType) && (
                <button
                  onClick={handleClearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Clear filters
                </button>
              )}
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
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Verified
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.user_id)}
                            onChange={() => toggleSelectUser(user.user_id)}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => router.push(`/users/${user.user_id}`)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate text-left"
                              >
                                {user.first_name} {user.last_name}
                              </button>
                              <div className="text-xs text-slate-500 truncate">{user.target_course || 'No course selected'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{user.email || '-'}</div>
                          <div className="text-xs text-slate-500">{user.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge-info">
                            {user.user_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeColor(user.status)}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className={`flex items-center text-xs ${user.email_verified ? 'text-emerald-600' : 'text-slate-400'}`}>
                              <span className="mr-1">{user.email_verified ? '✓' : '✗'}</span> Email
                            </div>
                            <div className={`flex items-center text-xs ${user.phone_verified ? 'text-emerald-600' : 'text-slate-400'}`}>
                              <span className="mr-1">{user.phone_verified ? '✓' : '✗'}</span> Phone
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.user_id, e.target.value)}
                            className="input-base px-3 py-1.5 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspend</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm ml-3"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-600">
                        Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
                        <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-lg space-x-2">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3"
                        >
                          First
                        </button>
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={!pagination.hasPrev}
                          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={!pagination.hasNext}
                          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                          Next →
                        </button>
                        <button
                          onClick={() => setPage(pagination.totalPages)}
                          disabled={page === pagination.totalPages}
                          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3"
                        >
                          Last
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
