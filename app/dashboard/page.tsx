'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Project } from '@/lib/types'
import { PlusCircle, FileText, Calendar, Building2 } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('designer_id', user.id)
        .order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    fetchProjects()
  }, [])

  const stats = {
    total: projects.length,
    active: projects.filter(p => !['completed','reward_paid'].includes(p.status)).length,
    secured: projects.filter(p => ['sale_secured','completed','reward_paid'].includes(p.status)).length,
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your Gewiss electrical projects</p>
        </div>
        <Link href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm">
          <PlusCircle className="w-4 h-4" />New Project
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: stats.total, color: 'text-gray-900' },
          { label: 'Active', value: stats.active, color: 'text-blue-600' },
          { label: 'Sales Secured', value: stats.secured, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map(project => (
            <Link key={project.id} href={`/dashboard/project/${project.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors truncate">
                    {project.project_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.beneficiary_name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString('ro-RO')}</span>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm mb-4">No projects yet</p>
          <Link href="/dashboard/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors">
            <PlusCircle className="w-4 h-4" />Create your first project
          </Link>
        </div>
      )}
    </div>
  )
}
