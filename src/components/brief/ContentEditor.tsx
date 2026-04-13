'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BriefRow } from '@/types'
import { useRealtimeScore } from '@/hooks/useRealtimeScore'
import { ScorePanel } from './ScorePanel'
import { BriefDisplay } from './BriefDisplay'

const AUTOSAVE_INTERVAL_MS = 30_000

export function ContentEditor({ brief }: { brief: BriefRow }) {
  const [draft, setDraft] = useState(brief.draft_content ?? '')
  const [saving, setSaving] = useState(false)
  const score = useRealtimeScore(draft, brief.generated_brief)
  const lastSavedRef = useRef(draft)
  const scoreRef = useRef(score)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const save = useCallback(
    async (text: string) => {
      if (text === lastSavedRef.current) return
      setSaving(true)
      try {
        await fetch(`/api/brief/${brief.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draft_content: text,
            last_score: scoreRef.current?.total ?? null,
          }),
        })
        lastSavedRef.current = text
      } catch {
        toast.error('Auto-save failed')
      } finally {
        setSaving(false)
      }
    },
    [brief.id]
  )

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => save(draft), AUTOSAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [draft, save])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_240px] gap-6 h-full">
      {/* Brief panel */}
      {brief.generated_brief && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[calc(100vh-160px)]">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
            Content Brief
          </h2>
          <BriefDisplay brief={brief.generated_brief} />
        </div>
      )}

      {/* Editor */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-medium text-gray-500">
            Draft (Markdown supported)
          </span>
          <span className="text-xs text-gray-400">{saving ? 'Saving…' : 'Auto-saved'}</span>
        </div>
        <textarea
          className="flex-1 p-4 text-sm text-gray-900 font-mono resize-none focus:outline-none min-h-[calc(100vh-220px)]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => save(draft)}
          placeholder={`# ${brief.generated_brief?.recommended_h1 ?? 'Start writing your article here…'}

Write your article using markdown headings (## for H2, ### for H3) to structure your content.`}
          spellCheck
        />
      </div>

      {/* Score panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[calc(100vh-160px)]">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
          SEO Score
        </h2>
        <ScorePanel score={score} />
      </div>
    </div>
  )
}
