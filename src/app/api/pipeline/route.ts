import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchSerp } from '@/lib/serper'
import { extractAllContent } from '@/lib/jina'
import { generateBrief } from '@/lib/claude'
import { z } from 'zod'

// Allow up to 60s on Vercel Pro / self-hosted
export const maxDuration = 60

const schema = z.object({
  keyword: z.string().trim().min(1).max(200),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid keyword', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { keyword } = parsed.data

  // 1. Create a placeholder row immediately so the UI can poll status
  const { data: brief, error: insertError } = await supabase
    .from('briefs')
    .insert({ keyword, user_id: user.id, status: 'processing' })
    .select('id')
    .single()

  if (insertError || !brief) {
    return NextResponse.json(
      { error: 'Failed to create brief record', details: insertError?.message },
      { status: 500 }
    )
  }

  const briefId = brief.id

  // 2. Run the pipeline asynchronously — client will poll for status
  runPipeline(briefId, keyword, user.id).catch((err) => {
    console.error(`[pipeline] unhandled error for brief ${briefId}:`, err)
  })

  return NextResponse.json({ brief_id: briefId, status: 'processing' }, { status: 202 })
}

async function runPipeline(briefId: string, keyword: string, userId: string) {
  // Use a fresh server client (can't reuse the one from the request handler
  // since it's tied to the request lifecycle)
  const supabase = await createClient()

  async function fail(message: string) {
    await supabase
      .from('briefs')
      .update({ status: 'error', error_message: message })
      .eq('id', briefId)
      .eq('user_id', userId)
  }

  try {
    // Step 1: SERP
    let serpResults
    try {
      serpResults = await fetchSerp(keyword)
    } catch (err) {
      await fail(`SERP fetch failed: ${String(err)}`)
      return
    }

    await supabase
      .from('briefs')
      .update({ serp_results: serpResults })
      .eq('id', briefId)

    // Step 2: Extract content via Jina
    let extractedContent
    try {
      extractedContent = await extractAllContent(serpResults)
    } catch (err) {
      await fail(`Content extraction failed: ${String(err)}`)
      return
    }

    await supabase
      .from('briefs')
      .update({ extracted_content: extractedContent })
      .eq('id', briefId)

    // Step 3: Generate brief with Claude
    let generatedBrief
    try {
      generatedBrief = await generateBrief(keyword, extractedContent)
    } catch (err) {
      await fail(`Brief generation failed: ${String(err)}`)
      return
    }

    // Step 4: Mark complete
    await supabase
      .from('briefs')
      .update({
        generated_brief: generatedBrief,
        status: 'complete',
        error_message: null,
      })
      .eq('id', briefId)
  } catch (err) {
    await fail(`Unexpected pipeline error: ${String(err)}`)
  }
}
