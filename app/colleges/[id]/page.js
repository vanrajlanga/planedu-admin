'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { collegeAPI } from '@/lib/api'
import AdminLayout from '@/app/components/AdminLayout'
import toast from 'react-hot-toast'

export default function EditCollegePage() {
  const router = useRouter()
  const params = useParams()
  const collegeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [college, setCollege] = useState(null)
  const [formData, setFormData] = useState({
    college_name: '',
    short_name: '',
    established_year: '',
    college_type: '',
    ownership: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    address: '',
    latitude: '',
    longitude: '',
    website_url: '',
    phone: '',
    email: '',
    description: '',
    logo_url: '',
    is_featured: false,
    is_verified: false,
    status: ''
  })

  useEffect(() => {
    fetchCollege()
  }, [collegeId])

  const fetchCollege = async () => {
    try {
      setLoading(true)
      const response = await collegeAPI.getCollege(collegeId)

      if (response.data.success) {
        const data = response.data.data
        setCollege(data)
        setFormData({
          college_name: data.college_name || '',
          short_name: data.short_name || '',
          established_year: data.established_year || '',
          college_type: data.college_type || '',
          ownership: data.ownership || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          pincode: data.pincode || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          website_url: data.website_url || '',
          phone: data.phone || '',
          email: data.email || '',
          description: data.description || '',
          logo_url: data.logo_url || '',
          is_featured: data.is_featured || false,
          is_verified: data.is_verified || false,
          status: data.status || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch college:', error)
      toast.error('Failed to load college data')
      router.push('/colleges')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.college_name || !formData.state || !formData.city) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      // Prepare data - only send changed fields
      const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' || typeof value === 'boolean') {
          acc[key] = value
        }
        return acc
      }, {})

      const response = await collegeAPI.updateCollege(collegeId, dataToSubmit)

      if (response.data.success) {
        toast.success('College updated successfully!')
        router.push('/colleges')
      }
    } catch (error) {
      console.error('Failed to update college:', error)
      toast.error(error.response?.data?.message || 'Failed to update college')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      router.push('/colleges')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading college data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!college) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 text-center">
            <p className="text-slate-600">College not found</p>
            <button
              onClick={() => router.push('/colleges')}
              className="btn-primary mt-4"
            >
              Back to Colleges
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/colleges')}
            className="text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Colleges
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Edit College</h1>
          <p className="text-slate-600 mt-1">Update college information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  College Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="e.g., Indian Institute of Technology Delhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  name="short_name"
                  value={formData.short_name}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="e.g., IIT Delhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Established Year
                </label>
                <input
                  type="number"
                  name="established_year"
                  value={formData.established_year}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="e.g., 1961"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  College Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="college_type"
                  value={formData.college_type}
                  onChange={handleChange}
                  required
                  className="input-base"
                >
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="Institute">Institute</option>
                  <option value="School">School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ownership <span className="text-red-500">*</span>
                </label>
                <select
                  name="ownership"
                  value={formData.ownership}
                  onChange={handleChange}
                  required
                  className="input-base"
                >
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Public-Private">Public-Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="e.g., Delhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="e.g., New Delhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="e.g., 110016"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="input-base"
                  placeholder="Full address of the college"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  className="input-base"
                  placeholder="e.g., 28.5449"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  className="input-base"
                  placeholder="e.g., 77.1927"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="https://www.example.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="info@college.edu"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="input-base"
                  placeholder="Brief description about the college..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter the full URL to the college logo image
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-base"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-start gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Featured College</span>
                    <p className="text-xs text-slate-500">Display this college prominently</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Verified</span>
                    <p className="text-xs text-slate-500">Mark as officially verified</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* College Stats (Read-only) */}
          <div className="card p-6 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Average Rating
                </label>
                <div className="text-2xl font-bold text-slate-900">
                  {college.avg_rating ? parseFloat(college.avg_rating).toFixed(1) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Total Reviews
                </label>
                <div className="text-2xl font-bold text-slate-900">
                  {college.total_reviews || 0}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  View Count
                </label>
                <div className="text-2xl font-bold text-slate-900">
                  {college.view_count || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
