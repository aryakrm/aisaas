'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Users, Activity, DollarSign, Key, ArrowLeft, Save, RefreshCw } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (profile?.role !== 'admin') {
        toast.error('Access denied')
        router.push('/dashboard')
      } else {
        fetchStats()
      }
    }
  }, [user, profile, loading, router])

  const fetchStats = async () => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get-stats' }
      })

      if (error) throw error
      setStats(data?.data || {})
    } catch (error) {
      toast.error('Failed to fetch stats')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get-users', data: { limit: 100 } }
      })

      if (error) throw error
      setUsers(data?.data || [])
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchApiKeys = async () => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get-api-keys' }
      })

      if (error) throw error
      setApiKeys(data?.data || [])
    } catch (error) {
      toast.error('Failed to fetch API keys')
    } finally {
      setLoadingData(false)
    }
  }

  const updateUserCredits = async () => {
    if (!selectedUser || !creditAmount) {
      toast.error('Please select user and enter amount')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'update-user-credits',
          data: {
            userId: selectedUser.id,
            credits: parseInt(creditAmount),
            reason: 'Admin adjustment'
          }
        }
      })

      if (error) throw error
      toast.success('Credits updated successfully')
      setSelectedUser(null)
      setCreditAmount('')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update credits')
    }
  }

  const updateApiKey = async (service, apiKey) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'upsert-api-key',
          data: { service, apiKey }
        }
      })

      if (error) throw error
      toast.success(`${service} API key updated`)
      fetchApiKeys()
    } catch (error) {
      toast.error('Failed to update API key')
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers()
    } else if (activeTab === 'api-keys' && apiKeys.length === 0) {
      fetchApiKeys()
    }
  }, [activeTab])

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <button
              onClick={activeTab === 'stats' ? fetchStats : activeTab === 'users' ? fetchUsers : fetchApiKeys}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          {[
            { id: 'stats', label: 'Statistics', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'api-keys', label: 'API Keys', icon: Key }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                </div>
                <Users className="h-12 w-12 text-indigo-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Generations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalGenerations || 0}</p>
                </div>
                <Activity className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">${((stats.totalRevenue || 0) / 100).toFixed(2)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions || 0}</p>
                </div>
                <Key className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{u.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.credits}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {u.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Credits Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-bold mb-4">Update Credits</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                      <input
                        type="text"
                        value={selectedUser.id}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Credits</label>
                      <input
                        type="text"
                        value={selectedUser.credits}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Credits</label>
                      <input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Enter new credit amount"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={updateUserCredits}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(null)
                          setCreditAmount('')
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-6">Configure AI Service API Keys</h3>
              <div className="space-y-6">
                {[
                  { service: 'openai', label: 'OpenAI', description: 'For GPT-4, DALL-E, and TTS' },
                  { service: 'stability', label: 'Stability AI', description: 'For Stable Diffusion' },
                  { service: 'elevenlabs', label: 'ElevenLabs', description: 'For voice synthesis' },
                  { service: 'replicate', label: 'Replicate', description: 'For various AI models' }
                ].map((item) => {
                  const existing = apiKeys.find(k => k.service_name === item.service)
                  return (
                    <div key={item.service} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          {existing && (
                            <p className="text-xs text-green-600 mt-1">
                              Active (Last used: {existing.last_used_at ? new Date(existing.last_used_at).toLocaleDateString() : 'Never'})
                            </p>
                          )}
                        </div>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const formData = new FormData(e.target)
                          const apiKey = formData.get('apiKey')
                          if (apiKey) updateApiKey(item.service, apiKey)
                        }}
                        className="flex space-x-2"
                      >
                        <input
                          name="apiKey"
                          type="password"
                          placeholder={`Enter ${item.label} API key`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
