import Link from 'next/link'
import { BriefListItem, BriefStatus } from '@/types'

const statusConfig: Record<BriefStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Processing…', color: 'bg-yellow-100 text-yellow-700' },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700' },
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const color =
    score >= 80 ? 'text-green-700' : score >= 50 ? 'text-yellow-700' : 'text-red-600'
  return (
    <span className={`text-sm font-semibold ${color}`}>{score}/100</span>
  )
}

export function BriefCard({ brief }: { brief: BriefListItem }) {
  const status = statusConfig[brief.status] ?? statusConfig.pending
  const date = new Date(brief.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isClickable = brief.status === 'complete' || brief.status === 'processing'

  const content = (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
          {brief.keyword}
        </h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{date}</span>
        {brief.target_word_count && (
          <span>{brief.target_word_count.toLocaleString()} words</span>
        )}
      </div>
      {brief.last_score !== null && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Score</span>
          <ScoreBadge score={brief.last_score} />
        </div>
      )}
    </div>
  )

  if (isClickable) {
    return <Link href={`/brief/${brief.id}`}>{content}</Link>
  }
  return content
}
