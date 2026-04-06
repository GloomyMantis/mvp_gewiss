
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Look up user by username to get their email
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, role, username')
        .eq('username', username.trim().toLowerCase())
        .single()

      if (profileError || !userProfile) {
        setError('Invalid username or password.')
        setLoading(false)
        return
      }

      // Sign in with email (username@gewiss.local convention)
      const email = `${username.trim().toLowerCase()}@gewiss.local`
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Invalid username or password.')
        setLoading(false)
        return
      }

      // Redirect based on role
      if (userProfile.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/30">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gewiss Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Electric project tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="your.username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-brand-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your administrator for account access
        </p>
      </div>
    </div>
  )
}
