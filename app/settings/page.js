'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/app/components/AdminLayout'
import { settingsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [groupedSettings, setGroupedSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [categories, setCategories] = useState([])
  const [editedSettings, setEditedSettings] = useState({})

  useEffect(() => {
    fetchSettings()
    fetchCategories()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await settingsAPI.getSettings()
      if (response.data.success) {
        setSettings(response.data.data.settings)
        setGroupedSettings(response.data.data.grouped)

        // Initialize editedSettings with current values
        const initialEdits = {}
        response.data.data.settings.forEach(setting => {
          initialEdits[setting.setting_key] = setting.setting_value
        })
        setEditedSettings(initialEdits)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await settingsAPI.getCategories()
      if (response.data.success) {
        setCategories(response.data.data)
        if (response.data.data.length > 0) {
          setActiveTab(response.data.data[0])
        }
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const handleSettingChange = (key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      // Create array of changed settings
      const changedSettings = settings
        .filter(setting => editedSettings[setting.setting_key] !== setting.setting_value)
        .map(setting => ({
          setting_key: setting.setting_key,
          setting_value: editedSettings[setting.setting_key]
        }))

      if (changedSettings.length === 0) {
        toast.success('No changes to save')
        return
      }

      const response = await settingsAPI.bulkUpdateSettings(changedSettings)

      if (response.data.success) {
        toast.success('Settings saved successfully')
        fetchSettings() // Refresh
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const renderSettingInput = (setting) => {
    const value = editedSettings[setting.setting_key] || ''

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleSettingChange(setting.setting_key, e.target.checked.toString())}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-slate-600">
              {setting.description || 'Enable this setting'}
            </span>
          </div>
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder={setting.description || ''}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder={setting.description || ''}
          />
        )

      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder={setting.description || ''}
          />
        )
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-slate-600">Loading settings...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-600 mt-1">Manage your system configuration and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === category
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6">
            <div className="space-y-6">
              {groupedSettings[activeTab]?.map((setting) => (
                <div key={setting.id} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        {setting.setting_key.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </label>
                      {setting.description && (
                        <p className="text-sm text-slate-500">{setting.description}</p>
                      )}
                    </div>
                    {setting.is_public && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Settings</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Settings marked as "Public" are accessible to frontend users. Other settings are admin-only.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
