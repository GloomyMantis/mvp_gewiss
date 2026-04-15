'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProjectStatus, STATUS_LABELS } from '@/lib/types'
import { ArrowLeft, Calendar, Building2, HardHat, FileText, Download, Plus, Upload, X, Trash2 } from 'lucide-react'

export default function ProjectDetailClient({ id }: { id: string }) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<any>(null)
  const [boqFiles, setBoqFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [realId, setRealId] = useState<string>(id)

  useEffect(() => {
    const storedId = localStorage.getItem('selectedProjectId')
    const projectId = storedId || id
    setRealId(projectId)
    fetchProject(projectId)
  }, [])

  const fetchProject = async (projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).eq('designer_id', user.id).single()
    if (!data) { router.replace('/dashboard'); return }
    setProject(data)
    const { data: files } = await supabase.from('boq_files').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false })
    setBoqFiles(files ?? [])
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0]
      setNewFile(f)
      setNewFileName(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const uploadBoq = async () => {
    if (!newFile || !project) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = newFile.name.split('.').pop()
    const fileName = `${project.designer_id}/${realId}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from('boq-files').upload(fileName, newFile)
    if (!uploadError && uploadData) {
      await supabase.from('boq_files').insert({
        project_id: realId,
        file_path: uploadData.path,
        file_name: newFile.name,
        display_name: newFileName.trim() || newFile.name,
        file_size_bytes: newFile.size,
        uploaded_by: user!.id,
      })
      setNewFile(null)
      setNewFileName('')
      setShowUpload(false)
      fetchProject(realId)
    }
    setUploading(false)
  }

  const deleteBoq = async (boqFile: any) => {
    await supabase.storage.from('boq-files').remove([boqFile.file_path])
    await supabase.from('boq_files').delete().eq('id', boqFile.id)
    setBoqFiles(prev => prev.filter(f => f.id !== boqFile.id))
  }

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('boq-files').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" /></div>
  if (!project) return null

  const isEditable = !['completed', 'reward_paid'].includes(project.status)
  const statuses: ProjectStatus[] = ['registered', 'in_quotation', 'sale_secured', 'completed', 'reward_paid']
  const currentIdx = statuses.indexOf(project.status)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.project_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={project.status as ProjectStatus} />
            {project.reward_paid && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Reward Paid ✓</span>}
            {project.project_value && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">€ {Number(project.project_value).toLocaleString('ro-RO', { minimumFractionDigits: 2 })}</span>}
          </div>
        </div>
        {isEditable && (
          <Link href={`/dashboard/project/${project.id}/edit`}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Edit
          </Link>
        )}
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4">
        <div className="p-5 grid grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5"><Building2 className="w-3.5 h-3.5" /> Beneficiary</div>
            <div className="text-sm font-medium text-gray-900">{project.beneficiary_name}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5"><HardHat className="w-3.5 h-3.5" /> Installer</div>
            <div className="text-sm font-medium text-gray-900">{project.installer_name}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Submitted</div>
            <div className="text-sm font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Last Updated</div>
            <div className="text-sm font-medium text-gray-900">{new Date(project.updated_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
        {project.observations && (
          <div className="p-5">
            <div className="text-xs text-gray-400 mb-2">Observations</div>
            <p className="text-sm text-gray-700 leading-relaxed">{project.observations}</p>
          </div>
        )}
      </div>

      {/* BOQ Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">BOQ Documents ({boqFiles.length})</h2>
          <button onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        </div>

        {showUpload && (
          <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            {!newFile ? (
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-400 transition-all">
                <Upload className="w-5 h-5 text-orange-300 mx-auto mb-1" />
                <p className="text-sm text-orange-600">Click to select file</p>
                <p className="text-xs text-orange-400 mt-0.5">PDF, Excel, Word</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <FileText className="w-4 h-4" />
                  <span className="truncate">{newFile.name}</span>
                  <button onClick={() => setNewFile(null)} className="ml-auto text-orange-400 hover:text-orange-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-orange-600 mb-1">Document name</label>
                  <input type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowUpload(false); setNewFile(null) }}
                    className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                  <button onClick={uploadBoq} disabled={uploading}
                    className="flex-1 py-2 text-sm text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {boqFiles.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No documents uploaded yet</div>
        ) : (
          <div className="space-y-2">
            {boqFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{f.display_name || f.file_name}</div>
                  <div className="text-xs text-gray-400">
                    {f.file_name.split('.').pop()?.toUpperCase()} · {new Date(f.uploaded_at).toLocaleDateString('ro-RO')}
                    {f.file_size_bytes && ` · ${(f.file_size_bytes / 1024).toFixed(0)} KB`}
                  </div>
                </div>
                <button onClick={() => getSignedUrl(f.file_path)}
                  className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => deleteBoq(f)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status Progress</div>
        <div className="flex items-center">
          {statuses.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${i <= currentIdx ? (i === currentIdx ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-orange-600 text-white') : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-[9px] mt-1 text-center leading-tight max-w-[60px] ${i === currentIdx ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < statuses.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-orange-400' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
