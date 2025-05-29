import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Cog6ToothIcon, 
  CheckCircleIcon, 
  CircleStackIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    onSuccess: (data) => {
      const settingsMap: Record<string, string> = {}
      data.settings.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })
      setSettings(settingsMap)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      api.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })

  const handleUpdateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    updateMutation.mutate({ key, value })
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BellIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">New conversation alerts</span>
              <input 
                type="checkbox" 
                className="w-4 h-4 text-slate-600 bg-slate-100 border-slate-300 rounded focus:ring-slate-500" 
                defaultChecked 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Customer registration alerts</span>
              <input 
                type="checkbox" 
                className="w-4 h-4 text-slate-600 bg-slate-100 border-slate-300 rounded focus:ring-slate-500" 
                defaultChecked 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">System alerts</span>
              <input 
                type="checkbox" 
                className="w-4 h-4 text-slate-600 bg-slate-100 border-slate-300 rounded focus:ring-slate-500" 
                defaultChecked 
              />
            </div>
            <button className="w-full bg-slate-800 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-900 transition-colors">
              Save Preferences
            </button>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CircleStackIcon className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Database</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-green-50/80 p-4 rounded-xl border border-green-200/60">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Status: Connected</span>
              </div>
              <div className="text-xs text-green-600">Last updated: 2 minutes ago</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-slate-100 text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                Backup
              </button>
              <button className="bg-slate-100 text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                Optimize
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Two-factor authentication</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Session timeout</span>
              <span className="text-xs text-slate-600">24 hours</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
              <span className="text-sm font-medium text-slate-700">API rate limiting</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Cog6ToothIcon className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">System Info</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-medium text-slate-800">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Environment</span>
              <span className="text-sm font-medium text-slate-800">Production</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Uptime</span>
              <span className="text-sm font-medium text-slate-800">7 days, 14 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Last restart</span>
              <span className="text-sm font-medium text-slate-800">Dec 15, 2024</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 