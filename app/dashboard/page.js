'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  Sparkles, Image as ImageIcon, Video, Music, MessageSquare, 
  Mic, LogOut, Settings, CreditCard, User, BarChart3, Shield
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('text')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [generations, setGenerations] = useState([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      fetchGenerations()
    }
  }, [user, loading, router])

  const fetchGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setGenerations(data || [])
    } catch (error) {
      console.error('Error fetching generations:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (profile?.credits < 1) {
      toast.error('Insufficient credits. Please purchase more.')
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const serviceMap = {
        'text': { service: 'openai', model: 'gpt-4', type: 'text' },
        'image': { service: 'openai', model: 'dall-e-3', type: 'image' },
        'video': { service: 'stability', model: 'stable-video', type: 'video' },
        'audio': { service: 'elevenlabs', model: 'elevenlabs-tts', type: 'audio' },
        'music': { service: 'replicate', model: 'music-gen', type: 'audio' }
      }

      const config = serviceMap[activeTab] || serviceMap['text']

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          service: config.service,
          model: config.model,
          type: config.type,
          prompt: prompt,
          parameters: {}
        }
      })

      if (error) throw error

      if (data?.data) {
        setResult(data.data)
        toast.success('Generation completed!')
        refreshProfile()
        fetchGenerations()
      } else {
        throw new Error('No data received')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Generation failed. Please ensure AI API keys are configured.')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Platform</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-indigo-900">{profile?.credits || 0} Credits</span>
              </div>
              
              {profile?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Generation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Tool Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Generation Tools</h2>
              
              <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {[
                  { id: 'text', label: 'Text', icon: MessageSquare, cost: 2 },
                  { id: 'image', label: 'Image', icon: ImageIcon, cost: 15 },
                  { id: 'video', label: 'Video', icon: Video, cost: 25 },
                  { id: 'audio', label: 'Audio', icon: Mic, cost: 3 },
                  { id: 'music', label: 'Music', icon: Music, cost: 5 }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                      <span className="text-xs opacity-75">({tab.cost})</span>
                    </button>
                  )
                })}
              </div>

              {/* Prompt Input */}
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Enter your ${activeTab} generation prompt...`}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />

                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Display */}
              {result && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Generated Result</h3>
                  {result.text && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{result.text}</p>
                    </div>
                  )}
                  {result.url && activeTab === 'image' && (
                    <img src={result.url} alt="Generated" className="w-full rounded-lg" />
                  )}
                  {result.url && (activeTab === 'video' || activeTab === 'audio' || activeTab === 'music') && (
                    <div className="text-sm text-gray-600">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        Download Result
                      </a>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Credits used: {result.creditsUsed}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Account Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Credits</span>
                  <span className="text-lg font-bold text-indigo-600">{profile?.credits || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tier</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {profile?.subscription_tier || 'Free'}
                  </span>
                </div>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition">
                Purchase Credits
              </button>
            </div>

            {/* Recent Generations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Generations</h3>
              <div className="space-y-3">
                {generations.slice(0, 5).map((gen) => (
                  <div key={gen.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{gen.type}</p>
                      <p className="text-xs text-gray-500 truncate">{gen.prompt}</p>
                      <p className="text-xs text-gray-400">{gen.credits_used} credits</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      gen.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      gen.status === 'failed' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {gen.status}
                    </span>
                  </div>
                ))}
                {generations.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No generations yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
