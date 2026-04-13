import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BriefCard } from '@/components/dashboard/BriefCard'
import { BriefListItem } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('briefs')
    .select('id, keyword, status, last_score, created_at, generated_brief')
    .order('created_at', { ascending: false })
    .limit(50)

  const briefs: BriefListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    last_score: row.last_score,
    created_at: row.created_at,
    target_word_count: row.generated_brief?.target_word_count ?? null,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Briefs</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {briefs.length} brief{briefs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          + New Brief
        </Link>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No briefs yet</p>
          <p className="text-sm mt-1">Create your first brief to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  )
}
