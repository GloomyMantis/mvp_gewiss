'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Project } from '@/lib/types'
import { PlusCircle, FileText, Calendar, Building2, TrendingUp, Euro, Award, Clock } from 'lucide-react'

const REWARD_PERCENT = 0.05 // 5%

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
      setProjects((data ?? []) as Project[])
      setLoading(false)
    }
    fetchProjects()
  }, [])

  const projectsWithValue = projects.filter(p => p.project_value)
  const totalPipelineValue = projectsWithValue.reduce((sum, p) => sum + (p.project_value ?? 0), 0)
  const securedValue = projects
    .filter(p => ['sale_secured', 'completed', 'reward_paid'].includes(p.status) && p.project_value)
    .reduce((sum, p) => sum + (p.project_value ?? 0), 0)
  const paidReward = projects
    .filter(p => p.reward_paid && p.project_value)
    .reduce((sum, p) => sum + (p.project_value ?? 0), 0)
  const pendingReward = projects
    .filter(p => ['sale_secured', 'completed'].includes(p.status) && !p.reward_paid && p.project_value)
    .reduce((sum, p) => sum + (p.project_value ?? 0), 0)

  const fmt = (val: number) => val.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

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
          <PlusCircle className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Earnings Section */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-6 mb-6 shadow-lg shadow-orange-200">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Recompensele Tale (5% din valoarea proiectului)</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/15 rounded-xl p-4">
            <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Potențial total
            </div>
            <div className="text-2xl font-bold text-white">€ {fmt(totalPipelineValue * REWARD_PERCENT)}</div>
            <div className="text-xs text-white/60 mt-0.5">din € {fmt(totalPipelineValue)} pipeline</div>
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> În așteptare
            </div>
            <div className="text-2xl font-bold text-white">€ {fmt(pendingReward * REWARD_PERCENT)}</div>
            <div className="text-xs text-white/60 mt-0.5">proiecte finalizate nepătite</div>
          </div>
          <div className="bg-white/20 rounded-xl p-4 border border-white/30">
            <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
              <Euro className="w-3 h-3" /> Încasat
            </div>
            <div className="text-2xl font-bold text-white">€ {fmt(paidReward * REWARD_PERCENT)}</div>
            <div className="text-xs text-white/60 mt-0.5">recompense plătite</div>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Proiecte', value: projects.length, color: 'text-gray-900' },
          { label: 'Active', value: projects.filter(p => !['completed', 'reward_paid'].includes(p.status)).length, color: 'text-blue-600' },
          { label: 'Vânzări Asigurate', value: projects.filter(p => ['sale_secured', 'completed', 'reward_paid'].includes(p.status)).length, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Projects List */}
      {projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map(project => (
            <button key={project.id}
              onClick={() => { localStorage.setItem('selectedProjectId', project.id); window.location.href = '/dashboard/project/placeholder/'; }}
              className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group text-left">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors truncate">
                    {project.project_name}
                  </span>
                  {project.project_value && (
                    <span className="text-xs text-gray-400 font-normal">
                      € {fmt(project.project_value)} → <span className="text-orange-600 font-medium">€ {fmt((project.project_value ?? 0) * REWARD_PERCENT)}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.beneficiary_name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString('ro-RO')}</span>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </button>
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
            <PlusCircle className="w-4 h-4" /> Create your first project
          </Link>
        </div>
      )}
    </div>
  )
}
