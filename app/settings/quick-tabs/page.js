'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { quickTabsAPI } from '../../../lib/api'

export default function QuickTabsPage() {
  const [quickTabs, setQuickTabs] = useState([])
  const [availableDegreeTypes, setAvailableDegreeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDegreeType, setSelectedDegreeType] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tabsRes, availableRes] = await Promise.all([
        quickTabsAPI.getQuickTabs(),
        quickTabsAPI.getAvailableDegreeTypes()
      ])

      if (tabsRes.data.success) {
        setQuickTabs(tabsRes.data.data)
      }
      if (availableRes.data.success) {
        setAvailableDegreeTypes(availableRes.data.data)
      }
    } catch (err) {
      setError('Failed to load quick tabs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      const res = await quickTabsAPI.toggleQuickTab(id)
      if (res.data.success) {
        setQuickTabs(tabs => tabs.map(tab =>
          tab.id === id ? { ...tab, is_active: !tab.is_active } : tab
        ))
        setSuccess('Quick tab updated successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to toggle quick tab')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this course from quick tabs?')) {
      return
    }

    try {
      const res = await quickTabsAPI.deleteQuickTab(id)
      if (res.data.success) {
        setQuickTabs(tabs => tabs.filter(tab => tab.id !== id))
        fetchData() // Refresh available degree types
        setSuccess('Quick tab removed successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to remove quick tab')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAdd = async () => {
    if (!selectedDegreeType) {
      setError('Please select a degree type')
      return
    }

    try {
      setSaving(true)
      const res = await quickTabsAPI.createQuickTab({
        degree_type: selectedDegreeType,
        display_name: displayName || selectedDegreeType,
        is_active: true
      })

      if (res.data.success) {
        setShowAddModal(false)
        setSelectedDegreeType('')
        setDisplayName('')
        fetchData()
        setSuccess('Quick tab added successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add quick tab')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedItem === null || draggedItem === index) return

    const newTabs = [...quickTabs]
    const draggedTab = newTabs[draggedItem]
    newTabs.splice(draggedItem, 1)
    newTabs.splice(index, 0, draggedTab)

    setQuickTabs(newTabs)
    setDraggedItem(index)
  }

  const handleDragEnd = async () => {
    if (draggedItem === null) return

    try {
      const order = quickTabs.map((tab, index) => ({
        id: tab.id,
        display_order: index + 1
      }))

      await quickTabsAPI.reorderQuickTabs(order)
      setSuccess('Order saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save order')
      fetchData() // Revert to original order
      setTimeout(() => setError(''), 3000)
    }

    setDraggedItem(null)
  }

  const handleUpdateDisplayName = async (id, newName) => {
    try {
      await quickTabsAPI.updateQuickTab(id, { display_name: newName })
      setQuickTabs(tabs => tabs.map(tab =>
        tab.id === id ? { ...tab, display_name: newName } : tab
      ))
      setSuccess('Display name updated')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update display name')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Quick Tabs Management</h1>
          <p className="text-slate-600 mt-1">
            Manage which courses appear in the navbar quick tabs. Drag to reorder.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={availableDegreeTypes.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            + Add Course to Quick Tabs
          </button>
          {availableDegreeTypes.length === 0 && !loading && (
            <span className="ml-3 text-sm text-slate-500">
              All available courses are already added
            </span>
          )}
        </div>

        {/* Quick Tabs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Degree Type</div>
                <div className="col-span-3">Display Name</div>
                <div className="col-span-2">Colleges</div>
                <div className="col-span-1">Active</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {quickTabs.map((tab, index) => (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`px-4 py-3 grid grid-cols-12 gap-4 items-center cursor-move hover:bg-slate-50 transition-colors ${
                    draggedItem === index ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="col-span-1 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div className="col-span-3 font-medium text-slate-900">
                    {tab.degree_type}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={tab.display_name}
                      onChange={(e) => {
                        setQuickTabs(tabs => tabs.map(t =>
                          t.id === tab.id ? { ...t, display_name: e.target.value } : t
                        ))
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== tab.degree_type) {
                          handleUpdateDisplayName(tab.id, e.target.value)
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="col-span-2 text-slate-600">
                    {tab.college_count?.toLocaleString() || 0} colleges
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => handleToggle(tab.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        tab.is_active ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          tab.is_active ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleDelete(tab.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {quickTabs.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500">
                  No quick tabs configured. Add some courses to display in the navbar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Preview</h3>
          <div className="bg-gradient-to-r from-green-900 to-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="px-3 py-1.5 bg-white/90 text-green-900 text-sm font-medium rounded-md">
                All Courses
              </span>
              {quickTabs.filter(t => t.is_active).map(tab => (
                <span
                  key={tab.id}
                  className="px-3 py-1.5 text-white/90 text-sm font-medium whitespace-nowrap"
                >
                  {tab.display_name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Add Course to Quick Tabs</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Degree Type
                  </label>
                  <select
                    value={selectedDegreeType}
                    onChange={(e) => {
                      setSelectedDegreeType(e.target.value)
                      setDisplayName(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a course...</option>
                    {availableDegreeTypes.map(dt => (
                      <option key={dt.degree_type} value={dt.degree_type}>
                        {dt.degree_type} ({dt.college_count} colleges)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Custom display name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Leave empty to use the degree type as display name
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedDegreeType('')
                    setDisplayName('')
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !selectedDegreeType}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : 'Add to Quick Tabs'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
