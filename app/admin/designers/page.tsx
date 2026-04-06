'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, FolderOpen, TrendingUp, DollarSign } from 'lucide-react'

export default function AdminDesignersPage() {
  const supabase = createClient()
  const [designers, setDesigners] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'designer').order('created_at', { ascending: false }),
        supabase.from('projects').select('*'),
      ])
      setDesigners(d ?? [])
      setProjects(p ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const designerStats = designers.map(d => {
    const dProjects = projects.filter(p => p.designer_id === d.id)
    return {
      ...d,
      total: dProjects.length,
      secured: dProjects.filter(p => ['sale_secured','completed','reward_paid'].includes(p.status)).length,
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
    </div>
  )
}

function Stat({ label, value, icon, color = 'text-gray-700' }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
      <div className={`flex items-center gap-1 text-[10px] text-gray-400 justify-center mt-0.5`}>
        {icon}{label}
      </div>
    </div>
  )
}
