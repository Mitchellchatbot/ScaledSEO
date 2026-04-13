import { ScoringResult } from '@/types'

function ScoreRing({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color =
    score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-gray-900">{score}</span>
        <span className="block text-xs text-gray-400">/100</span>
      </div>
    </div>
  )
}

function Bar({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ScorePanel({ score }: { score: ScoringResult | null }) {
  if (!score) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Start writing to see your score
      </div>
    )
  }

  const { breakdown } = score

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2">
        <ScoreRing score={score.total} />
        <p className="text-xs text-gray-400">SEO Score</p>
      </div>

      <div className="space-y-3">
        <Bar score={breakdown.keywords.score} max={breakdown.keywords.max} label="Keyword Coverage" />
        <Bar score={breakdown.entities.score} max={breakdown.entities.max} label="Entity Coverage" />
        <Bar score={breakdown.h2.score} max={breakdown.h2.max} label="Heading Structure" />
        <Bar score={breakdown.wordCount.score} max={breakdown.wordCount.max} label="Word Count" />
        <Bar score={breakdown.h1.score} max={breakdown.h1.max} label="H1 Heading" />
      </div>

      {/* Word count detail */}
      <div className="text-xs text-gray-400 text-center">
        {breakdown.wordCount.actual.toLocaleString()} / {breakdown.wordCount.target.toLocaleString()} words
      </div>

      {/* Missing keywords */}
      {breakdown.keywords.details.filter((d) => !d.found).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-500 mb-1.5">Missing Keywords</p>
          <div className="flex flex-wrap gap-1">
            {breakdown.keywords.details
              .filter((d) => !d.found)
              .map((d) => (
                <span
                  key={d.term}
                  className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"
                >
                  {d.term} ({d.actual}/{d.min_required})
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Missing entities */}
      {breakdown.entities.missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-orange-500 mb-1.5">Missing Entities</p>
          <div className="flex flex-wrap gap-1">
            {breakdown.entities.missing.map((e) => (
              <span
                key={e}
                className="px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
