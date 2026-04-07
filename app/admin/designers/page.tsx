'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, FolderOpen, TrendingUp, DollarSign, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'

export default function AdminDesignersPage() {
  const supabase = createClient()
  const [designers, setDesigners] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDesigner, setEditingDesigner] = useState<any>(null)
  const [deletingDesigner, setDeletingDesigner] = useState<any>(null)
  const [editForm, setEditForm] = useState({ username: '', company_name: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'designer').order('created_at', { ascending: false }),
      supabase.from('projects').select('*'),
    ])
    setDesigners(d ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }

  const openEdit = (d: any) => {
    setEditingDesigner(d)
    setEditForm({ username: d.username, company_name: d.company_name })
    setError('')
  }

  const saveEdit = async () => {
    if (!editForm.username.trim() || !editForm.company_name.trim()) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('users')
      .update({ username: editForm.username.trim().toLowerCase(), company_name: editForm.company_name.trim() })
      .eq('id', editingDesigner.id)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    setEditingDesigner(null)
    setSaving(false)
    fetchAll()
  }

  const confirmDelete = async () => {
    setDeleting(true)
    // Delete projects first, then user
    await supabase.from('projects').delete().eq('designer_id', deletingDesigner.id)
    await supabase.from('users').delete().eq('id', deletingDesigner.id)
    // Also delete from auth
    setDeletingDesigner(null)
    setDeleting(false)
    fetchAll()
  }

  const designerStats = designers.map(d => {
    const dProjects = projects.filter(p => p.designer_id === d.id)
    return {
      ...d,
      total: dProjects.length,
      secured: dProjects.filter(p => ['sale_secured', 'completed', 'reward_paid'].includes(p.status)).length,
      pendingPayment: dProjects.filter(p => p.status === 'completed' && !p.reward_paid).length,
      paidCount: dProjects.filter(p => p.reward_paid).length,
    }
  })

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Designers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{designers.length} active designers</p>
      </div>

      <div className="space-y-3">
        {designerStats.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-700 font-semibold text-lg uppercase flex-shrink-0">
                {d.company_name.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{d.company_name}</div>
                <div className="text-sm text-gray-400">@{d.username}</div>
              </div>
              <div className="flex items-center gap-6">
                <Stat label="Projects" value={d.total} icon={<FolderOpen className="w-3.5 h-3.5" />} />
                <Stat label="Secured" value={d.secured} icon={<TrendingUp className="w-3.5 h-3.5" />} color="text-amber-600" />
                <Stat label="Pending Pay" value={d.pendingPayment} icon={<DollarSign className="w-3.5 h-3.5" />} color={d.pendingPayment > 0 ? 'text-red-600' : 'text-gray-400'} />
                <Stat label="Paid" value={d.paidCount} icon={<DollarSign className="w-3.5 h-3.5" />} color="text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => openEdit(d)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeletingDesigner(d)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {designerStats.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No designers registered yet</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDesigner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Edit Designer</h2>
              <button onClick={() => setEditingDesigner(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input type="text" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <input type="text" value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingDesigner(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDesigner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Designer</h2>
                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete <span className="font-medium text-gray-700">{deletingDesigner.company_name}</span>? This will also delete all their projects. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletingDesigner(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Designer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon, color = 'text-gray-700' }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 justify-center mt-0.5">
        {icon}{label}
      </div>
    </div>
  )
}
