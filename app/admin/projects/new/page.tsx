'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, CheckCircle2, ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AdminNewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [designers, setDesigners] = useState<any[]>([])
  const [form, setForm] = useState({
    project_name: '',
    installer_name: '',
    beneficiary_name: '',
    observations: '',
    project_value: '',
    designer_id: '',
  })
  const [boqFiles, setBoqFiles] = useState<{ file: File; displayName: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('users').select('id, username, company_name').eq('role', 'designer').order('company_name')
      .then(({ data }) => setDesigners(data ?? []))
  }, [])

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setBoqFiles(prev => [...prev, { file, displayName: file.name.replace(/\.[^/.]+$/, '') }])
      e.target.value = ''
    }
  }

  const removeFile = (idx: number) => setBoqFiles(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.designer_id) { setError('Please select a designer.'); return }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          project_name: form.project_name.trim(),
          installer_name: form.installer_name.trim(),
          beneficiary_name: form.beneficiary_name.trim(),
          observations: form.observations.trim() || null,
          project_value: form.project_value ? parseFloat(form.project_value) : null,
          designer_id: form.designer_id,
          status: 'registered',
          reward_paid: false,
        })
        .select()
        .single()

      if (insertError) throw insertError

      for (const { file, displayName } of boqFiles) {
        const ext = file.name.split('.').pop()
        const fileName = `${form.designer_id}/${project.id}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('boq-files').upload(fileName, file)
        if (uploadError) throw uploadError
        await supabase.from('boq_files').insert({
          project_id: project.id,
          file_path: uploadData.path,
          file_name: file.name,
          display_name: displayName.trim() || file.name,
          file_size_bytes: file.size,
          uploaded_by: user.id,
        })
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin/projects'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create project.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 max-w-xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Project Created!</h2>
          <p className="text-gray-500 text-sm mt-1">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add a project on behalf of a designer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Designer <span className="text-red-400">*</span></label>
            <select value={form.designer_id} onChange={e => setForm({ ...form, designer_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all" required>
              <option value="">Select designer...</option>
              {designers.map(d => (
                <option key={d.id} value={d.id}>{d.company_name} (@{d.username})</option>
              ))}
            </select>
          </div>

          {[
            { key: 'project_name', label: 'Project Name', placeholder: 'e.g. Industrial Complex Pitești', required: true },
            { key: 'beneficiary_name', label: 'Beneficiary Name', placeholder: 'e.g. SC Construct SRL', required: true },
            { key: 'installer_name', label: 'Installer Name', placeholder: 'e.g. Electro Install SRL', required: true },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input type="text" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                placeholder={placeholder} required={required} />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Value (EUR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input type="number" min="0" step="0.01" value={form.project_value}
                onChange={e => setForm({ ...form, project_value: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">BOQ Documents</h2>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add File
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" onChange={handleAddFile} className="hidden" />

          {boqFiles.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
              <Upload className="w-5 h-5 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop files here or <span className="text-orange-600 font-medium">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boqFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <input type="text" value={f.displayName}
                    onChange={e => setBoqFiles(prev => prev.map((x, xi) => xi === i ? { ...x, displayName: e.target.value } : x))}
                    className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none border-b border-transparent focus:border-orange-400"
                    placeholder="Document name..." />
                  <span className="text-xs text-gray-400">{f.file.name.split('.').pop()?.toUpperCase()}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add another file
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Observations <span className="text-gray-300 font-normal normal-case">(optional)</span>
          </label>
          <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all resize-none"
            placeholder="Any notes about the project..." rows={3} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium rounded-xl transition-all">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating project...
            </span>
          ) : 'Create Project'}
        </button>
      </form>
    </div>
  )
}
