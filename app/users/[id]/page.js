'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { userAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [activities, setActivities] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [resetLink, setResetLink] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUser()
      fetchAvailableRoles()
      fetchUserActivity()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getUser(userId)
      if (response.data.success) {
        setUser(response.data.data)
        setRoles(response.data.data.roles || [])
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRoles = async () => {
    try {
      const response = await userAPI.getAllRoles()
      if (response.data.success) {
        setAvailableRoles(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const fetchUserActivity = async () => {
    try {
      setLoadingActivity(true)
      const response = await userAPI.getUserActivity(userId, { limit: 20 })
      if (response.data.success) {
        setActivities(response.data.data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    try {
      const response = await userAPI.assignRole(userId, selectedRole)
      if (response.data.success) {
        toast.success('Role assigned successfully')
        setSelectedRole('')
        fetchUser()
      }
    } catch (error) {
      console.error('Failed to assign role:', error)
      toast.error(error.response?.data?.message || 'Failed to assign role')
    }
  }

  const handleRemoveRole = async (roleId) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return
    }

    try {
      const response = await userAPI.removeRole(userId, roleId)
      if (response.data.success) {
        toast.success('Role removed successfully')
        fetchUser()
      }
    } catch (error) {
      console.error('Failed to remove role:', error)
      toast.error('Failed to remove role')
    }
  }

  const handlePasswordReset = async () => {
    try {
      const response = await userAPI.initiatePasswordReset(userId)
      if (response.data.success) {
        setResetLink(response.data.data.reset_link)
        setShowPasswordResetModal(true)
        toast.success('Password reset initiated')
      }
    } catch (error) {
      console.error('Failed to initiate password reset:', error)
      toast.error('Failed to initiate password reset')
    }
  }

  const copyResetLink = () => {
    navigator.clipboard.writeText(resetLink)
    toast.success('Reset link copied to clipboard')
  }

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'search':
        return '🔍'
      case 'view':
        return '👁️'
      case 'click':
        return '👆'
      case 'favorite':
        return '⭐'
      default:
        return '📝'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">User not found</p>
          <button
            onClick={() => router.push('/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/users')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Users
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.first_name} {user.last_name}</h1>
              <p className="text-blue-100">{user.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                user.status === 'active' ? 'bg-green-100 text-green-800' :
                user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-medium">{user.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User Type</p>
                <p className="font-medium capitalize">{user.user_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">City, State</p>
                <p className="font-medium">{user.city && user.state ? `${user.city}, ${user.state}` : 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email Verified</p>
                <p className={`font-medium ${user.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.email_verified ? '✓ Verified' : '✗ Not Verified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Verified</p>
                <p className={`font-medium ${user.phone_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.phone_verified ? '✓ Verified' : '✗ Not Verified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="font-medium">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Login Count</p>
                <p className="font-medium">{user.login_count || 0} times</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registered</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-6 flex gap-3 flex-wrap">
          <button
            onClick={handlePasswordReset}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Reset Password
          </button>
          <button
            onClick={() => router.push(`/users`)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Role Management</h2>

          {/* Assign New Role */}
          <div className="mb-4">
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a role to assign</option>
                {availableRoles
                  .filter(r => !roles.includes(r.name))
                  .map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>

          {/* Current Roles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Current Roles</h3>
            {roles && roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map((roleName) => {
                  const roleObj = availableRoles.find(r => r.name === roleName)
                  return (
                    <div key={roleName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{roleName}</p>
                        {roleObj && <p className="text-sm text-gray-600">{roleObj.description}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveRole(roleObj?.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No roles assigned</p>
            )}
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {loadingActivity ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{activity.activity_type}</p>
                      {activity.entity_type && (
                        <p className="text-xs text-gray-600">
                          {activity.entity_type} {activity.entity_id && `#${activity.entity_id}`}
                        </p>
                      )}
                      {activity.search_query && (
                        <p className="text-xs text-gray-600">Search: "{activity.search_query}"</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No activity recorded</p>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Password Reset Link Generated</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with the user to reset their password. The link expires in 24 hours.
            </p>
            <div className="bg-gray-50 p-3 rounded border mb-4 break-all text-sm">
              {resetLink}
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyResetLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowPasswordResetModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
