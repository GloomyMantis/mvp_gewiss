export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProjectStatus } from '@/lib/types'
import { FileText, TrendingUp, DollarSign, Clock, ArrowRight } from 'lucide-react'

export default function AdminPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*, designer:users(username, company_name)')
        .order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const all = projects
  const stats = {
    total: all.length,
    inQuotation: all.filter(p => p.status === 'in_quotation').length,
    saleSecured: all.filter(p => ['sale_secured','completed','reward_paid'].includes(p.status)).length,
    pendingPayment: all.filter(p => p.status === 'completed' && !p.reward_paid).length,
    registered: all.filter(p => p.status === 'registered').length,
    completed: all.filter(p => p.status === 'completed').length,
    rewardPaid: all.filter(p => p.status === 'reward_paid').length,
    secured: all.filter(p => p.status === 'sale_secured').length,
  }
  const conversionRate = all.length > 0
    ? Math.round(((stats.saleSecured) / all.length) * 100) : 0

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gewiss project pipeline</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FileText className="w-5 h-5 text-gray-500" />} label="Total Projects" value={stats.total} bg="bg-gray-50" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-500" />} label="In Quotation" value={stats.inQuotation} bg="bg-blue-50" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-500" />} label="Sales Secured" value={stats.saleSecured} bg="bg-amber-50" />
        <StatCard icon={<DollarSign className="w-5 h-5 text-red-500" />} label="Pending Payment" value={stats.pendingPayment} bg="bg-red-50" highlight={stats.pendingPayment > 0} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 col-span-1">
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-semibold">Conversion Rate</div>
          <div className="text-4xl font-semibold text-gray-900">{conversionRate}%</div>
          <div className="text-sm text-gray-400 mt-1">projects → sales</div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 col-span-2">
          <div className="text-xs text-gray-400 mb-4 uppercase tracking-wide font-semibold">Pipeline Breakdown</div>
          <div className="space-y-2.5">
            {[
              { label: 'Registered', value: stats.registered, color: 'bg-slate-400' },
              { label: 'In Quotation', value: stats.inQuotation, color: 'bg-blue-500' },
              { label: 'Chance >50%', value: stats.secured, color: 'bg-amber-500' },
              { label: 'Completed', value: stats.completed, color: 'bg-green-500' },
              { label: 'Reward Paid', value: stats.rewardPaid, color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: all.length > 0 ? `${(item.value / all.length) * 100}%` : '0%' }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-4 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/admin/projects" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {projects.slice(0, 5).map((project: any) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{project.project_name}</div>
                <div className="text-xs text-gray-400">{project.designer?.company_name}</div>
              </div>
              <StatusBadge status={project.status as ProjectStatus} />
              {!project.reward_paid && project.status === 'completed' && (
                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">Pay</span>
              )}
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No projects yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bg, highlight = false }: { icon: React.ReactNode; label: string; value: number; bg: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-red-200' : 'border-gray-100'} p-5`}>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <div className={`text-3xl font-semibold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
