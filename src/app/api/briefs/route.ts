import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('briefs')
    .select('id, keyword, status, last_score, created_at, generated_brief')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch briefs' }, { status: 500 })
  }

  // Return lightweight list — extract only target_word_count from generated_brief
  const list = (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    last_score: row.last_score,
    created_at: row.created_at,
    target_word_count:
      row.generated_brief?.target_word_count ?? null,
  }))

  return NextResponse.json(list)
}
