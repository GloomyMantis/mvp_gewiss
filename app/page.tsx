
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard')
    }
    check()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
    </div>
  )
}
