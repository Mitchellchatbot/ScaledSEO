'use client'

import { useEffect, useRef, useState } from 'react'
import { BriefRow } from '@/types'
import { ContentEditor } from './ContentEditor'

const POLL_INTERVAL_MS = 3_000

export function BriefPageClient({ initialBrief }: { initialBrief: BriefRow }) {
  const [brief, setBrief] = useState<BriefRow>(initialBrief)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (brief.status === 'complete' || brief.status === 'error') return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/brief/${brief.id}`)
        if (!res.ok) return
        const data: BriefRow = await res.json()
        setBrief(data)
        if (data.status === 'complete' || data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // ignore transient network errors during polling
      }
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [brief.id, brief.status])

  if (brief.status === 'processing' || brief.status === 'pending') {
    return <ProcessingState keyword={brief.keyword} />
  }

  if (brief.status === 'error') {
    return <ErrorState brief={brief} />
  }

  return <ContentEditor brief={brief} />
}

function ProcessingState({ keyword }: { keyword: string }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900">Generating brief{dots}</p>
        <p className="text-sm text-gray-500 mt-1">
          Analyzing top results for <span className="font-medium">"{keyword}"</span>
        </p>
      </div>
      <div className="text-xs text-gray-400 max-w-sm text-center leading-relaxed">
        Fetching SERP data → extracting competitor content → generating AI brief.
        This takes 30–60 seconds.
      </div>
    </div>
  )
}

function ErrorState({ brief }: { brief: BriefRow }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xl">
        !
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900">Pipeline failed</p>
        {(brief as BriefRow & { error_message?: string }).error_message && (
          <p className="text-sm text-red-500 mt-1">
            {(brief as BriefRow & { error_message?: string }).error_message}
          </p>
        )}
      </div>
      <a
        href="/dashboard/new"
        className="text-sm text-blue-600 hover:underline"
      >
        Try a different keyword
      </a>
    </div>
  )
}
