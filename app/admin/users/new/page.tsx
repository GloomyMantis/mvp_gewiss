'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminNewUserPage() {
  const [form, setForm] = useState({ username: '', password: '', company_name: '', role: 'designer' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Use Supabase admin client via service role key
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const username = form.username.toLowerCase().trim()
      const email = `${username}@gewiss.local`

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: form.password,
        email_confirm: true,
        user_metadata: { username, company_name: form.company_name, role: form.role },
      })

      if (createError) throw new Error(createError.message)

      setSuccess(true)
      setForm({ username: '', password: '', company_name: '', role: 'designer' })
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create User</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add a new designer or admin account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />User created successfully! They can now log in.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input type="text" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '.') })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
              placeholder="first.last" required />
            <p className="text-xs text-gray-400 mt-1">Will login as: {form.username || 'username'}@gewiss.local</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
            <input type="text" value={form.company_name}
              onChange={e => setForm({ ...form, company_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
              placeholder="SC Design SRL" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Min. 8 characters" minLength={8} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all">
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
