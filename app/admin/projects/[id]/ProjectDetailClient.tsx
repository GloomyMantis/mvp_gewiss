'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Pencil, X, Check, Plus, Trash2, Upload } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProjectStatus, STATUS_LABELS } from '@/lib/types'

const STATUSES: ProjectStatus[] = ['registered', 'in_quotation', 'sale_secured', 'completed', 'reward_paid']

function EditableField({ label, value, fieldKey, editMode, multiline, onChange }: {
  label: string; value: string; fieldKey: string; editMode: boolean; multiline?: boolean
  onChange: (key: string, val: string) => void
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      {editMode ? (
        multiline ? (
          <textarea value={value} onChange={e => onChange(fieldKey, e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border-2 border-orange-500 bg-white text-sm focus:outline-none resize-none" />
        ) : (
          <input type="text" value={value} onChange={e => onChange(fieldKey, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-orange-500 bg-white text-sm focus:outline-none" />
        )
      ) : (
        <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
      )}
    </div>
  )
}

export default function ProjectDetailClient({ id }: { id: string }) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [project, setProject] = useState<any>(null)
  const [boqFiles, setBoqFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editFields, setEditFields] = useState({ project_name: '', beneficiary_name: '', installer_name: '', observations: '', project_value: '' })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => { fetchProject() }, [id])

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*, designer:users(username, company_name)').eq('id', id).single()
    setProject(data)
    if (data) setEditFields({
      project_name: data.project_name,
      beneficiary_name: data.beneficiary_name,
      installer_name: data.installer_name,
      observations: data.observations || '',
      project_value: data.project_value ? String(data.project_value) : '',
    })
    // Fetch BOQ files
    const { data: files } = await supabase.from('boq_files').select('*').eq('project_id', id).order('uploaded_at', { ascending: false })
    setBoqFiles(files ?? [])
    setLoading(false)
  }

  const cancelEdit = () => {
    setEditMode(false)
    if (project) setEditFields({
      project_name: project.project_name,
      beneficiary_name: project.beneficiary_name,
      installer_name: project.installer_name,
      observations: project.observations || '',
      project_value: project.project_value ? String(project.project_value) : '',
    })
  }

  const saveEdits = async () => {
    setSaving(true)
    const { error } = await supabase.from('projects').update({
      project_name: editFields.project_name.trim(),
      beneficiary_name: editFields.beneficiary_name.trim(),
      installer_name: editFields.installer_name.trim(),
      observations: editFields.observations.trim() || null,
      project_value: editFields.project_value ? parseFloat(editFields.project_value) : null,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    if (!error) { setProject({ ...project, ...editFields, project_value: editFields.project_value ? parseFloat(editFields.project_value) : null }); setEditMode(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000) }
    setSaving(false)
  }

  const updateStatus = async (status: ProjectStatus) => {
    setUpdating(true)
    const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) setProject({ ...project, status })
    setUpdating(false)
  }

  const toggleRewardPaid = async () => {
    setUpdating(true)
    const newVal = !project.reward_paid
    const updates: any = { reward_paid: newVal, updated_at: new Date().toISOString() }
    if (newVal) updates.status = 'reward_paid'
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (!error) setProject({ ...project, reward_paid: newVal, status: newVal ? 'reward_paid' : project.status })
    setUpdating(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0]
      setNewFile(f)
      setNewFileName(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const uploadBoq = async () => {
    if (!newFile) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = newFile.name.split('.').pop()
    const fileName = `${project.designer_id}/${id}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from('boq-files').upload(fileName, newFile)
    if (!uploadError && uploadData) {
      await supabase.from('boq_files').insert({
        project_id: id,
        file_path: uploadData.path,
        file_name: newFile.name,
        display_name: newFileName.trim() || newFile.name,
        file_size_bytes: newFile.size,
        uploaded_by: user!.id,
      })
      setNewFile(null)
      setNewFileName('')
      setShowUpload(false)
      fetchProject()
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
  if (!project) return <div className="p-8">Project not found</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Projects
      </Link>

      {saveSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xl z-50">
          <Check className="w-4 h-4 text-green-400" /> Changes saved
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{editMode ? editFields.project_name : project.project_name}</h1>
          <p className="text-sm text-gray-400 mt-1">by <span className="text-gray-600 font-medium">{project.designer?.company_name}</span> (@{project.designer?.username})</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={project.status as ProjectStatus} />
            {project.reward_paid && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Reward Paid ✓</span>}
            {project.project_value && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">€ {Number(project.project_value).toLocaleString('ro-RO', { minimumFractionDigits: 2 })}</span>}
          </div>
        </div>
        {!editMode ? (
          <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:text-orange-600 transition-all">
            <Pencil className="w-4 h-4" /> Edit Project
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={saveEdits} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-60">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project Details</h2>
          <EditableField label="Project Name" value={editMode ? editFields.project_name : project.project_name} fieldKey="project_name" editMode={editMode} onChange={(k,v) => setEditFields(p => ({...p,[k]:v}))} />
          <EditableField label="Beneficiary" value={editMode ? editFields.beneficiary_name : project.beneficiary_name} fieldKey="beneficiary_name" editMode={editMode} onChange={(k,v) => setEditFields(p => ({...p,[k]:v}))} />
          <EditableField label="Installer" value={editMode ? editFields.installer_name : project.installer_name} fieldKey="installer_name" editMode={editMode} onChange={(k,v) => setEditFields(p => ({...p,[k]:v}))} />
          <div>
            <div className="text-xs text-gray-400 mb-1">Project Value (EUR)</div>
            {editMode ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" min="0" step="0.01" value={editFields.project_value}
                  onChange={e => setEditFields(p => ({...p, project_value: e.target.value}))}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border-2 border-orange-500 bg-white text-sm focus:outline-none" />
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {project.project_value ? `€ ${Number(project.project_value).toLocaleString('ro-RO', { minimumFractionDigits: 2 })}` : '—'}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Submitted</div>
            <div className="text-sm font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Status</h2>
            <div className="space-y-1.5">
              {STATUSES.map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={updating || project.status === s}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${project.status === s ? 'bg-orange-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className={`bg-white rounded-2xl border p-4 ${project.reward_paid ? 'border-emerald-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Reward</div>
                <div className={`text-sm font-medium ${project.reward_paid ? 'text-emerald-600' : 'text-gray-500'}`}>{project.reward_paid ? '✓ Paid' : 'Not paid'}</div>
              </div>
              <button onClick={toggleRewardPaid} disabled={updating}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${project.reward_paid ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {project.reward_paid ? 'Mark Unpaid' : 'Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Observations</h2>
        <EditableField label="" value={editMode ? editFields.observations : (project.observations || 'No observations.')} fieldKey="observations" editMode={editMode} multiline onChange={(k,v) => setEditFields(p => ({...p,[k]:v}))} />
      </div>

      {/* BOQ Files Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">BOQ Documents ({boqFiles.length})</h2>
          <button onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        </div>

        {/* Upload new file */}
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
                  <button onClick={() => setNewFile(null)} className="ml-auto text-orange-400 hover:text-orange-600"><X className="w-4 h-4" /></button>
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

        {/* File list */}
        {boqFiles.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No documents uploaded yet</div>
        ) : (
          <div className="space-y-2">
            {boqFiles.map((f, i) => (
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
    </div>
  )
}
