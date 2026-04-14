'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Plus, X } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProjectStatus, STATUS_LABELS } from '@/lib/types'

const ALL_STATUSES: ProjectStatus[] = ['registered', 'in_quotation', 'sale_secured', 'completed', 'reward_paid']

export default function AdminProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [pendingOnly, setPendingOnly] = useState(false)
  const [designerFilter, setDesignerFilter] = useState<string | null>(null)
  const [designerName, setDesignerName] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('designer')
    if (d) setDesignerFilter(d)
    fetchProjects(d)
  }, [])

  const fetchProjects = async (designerId?: string | null) => {
    const { data } = await supabase
      .from('projects')
      .select('*, designer:users(id, username, company_name)')
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    if (designerId && data) {
      const found = data.find((p: any) => p.designer?.id === designerId)
      if (found) setDesignerName(found.designer?.company_name)
    }
    setLoading(false)
  }

  const clearDesignerFilter = () => {
    setDesignerFilter(null)
    setDesignerName(null)
    window.history.replaceState({}, '', '/admin/projects')
  }

  const filtered = projects.filter(p => {
    if (designerFilter && p.designer?.id !== designerFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (pendingOnly && !(p.status === 'completed' && !p.reward_paid)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.project_name?.toLowerCase().includes(q) ||
        p.beneficiary_name?.toLowerCase().includes(q) ||
        p.installer_name?.toLowerCase().includes(q) ||
        p.designer?.company_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} projects</p>
        </div>
        <Link href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-all">
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Designer filter banner */}
      {designerFilter && designerName && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700">
          <span>Showing projects for <span className="font-semibold">{designerName}</span></span>
          <button onClick={clearDesignerFilter} className="ml-auto flex items-center gap-1 text-orange-500 hover:text-orange-700">
            <X className="w-4 h-4" /> Clear filter
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, companies..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setStatusFilter('all'); setPendingOnly(false) }}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'all' && !pendingOnly ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPendingOnly(false) }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          <button
            onClick={() => { setPendingOnly(!pendingOnly); setStatusFilter('all') }}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              pendingOnly ? 'bg-red-600 text-white' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'
            }`}
          >
            Pending Pay
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">Project</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Designer</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Beneficiary</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Value</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((project: any) => (
                <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{project.project_name}</span>
                      {project.boq_file_path && (
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">BOQ</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{project.installer_name}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-gray-700">{project.designer?.company_name}</div>
                    <div className="text-xs text-gray-400">@{project.designer?.username}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{project.beneficiary_name}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">
                    {project.project_value ? `€ ${Number(project.project_value).toLocaleString('ro-RO')}` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={project.status as ProjectStatus} />
                    {project.status === 'completed' && !project.reward_paid && (
                      <div className="text-xs text-red-500 mt-1 font-medium">⚠ Unpaid</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString('ro-RO')}
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => window.location.href = `/admin/projects/${project.id}/`}
  className="text-xs text-orange-600 hover:text-orange-700 font-medium">
  View →
</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
