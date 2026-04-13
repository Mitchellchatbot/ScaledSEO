import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BriefPageClient } from '@/components/brief/BriefPageClient'

type Props = { params: Promise<{ id: string }> }

export default async function BriefPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← Dashboard
          </a>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-medium text-gray-700 truncate max-w-xl">
            {data.keyword}
          </h1>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            data.status === 'complete' ? 'bg-green-100 text-green-700' :
            data.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
            data.status === 'error' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {data.status}
          </span>
        </div>
      </header>
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <BriefPageClient initialBrief={data} />
      </div>
    </div>
  )
}
