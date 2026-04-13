import { useEffect, useState } from 'react'
import { calculateScore } from '@/lib/scoring'
import { GeneratedBrief, ScoringResult } from '@/types'

export function useRealtimeScore(draftText: string, brief: GeneratedBrief | null) {
  const [score, setScore] = useState<ScoringResult | null>(null)

  useEffect(() => {
    if (!brief) return

    const timer = setTimeout(() => {
      const result = calculateScore({ draftText, brief })
      setScore(result)
    }, 400)

    return () => clearTimeout(timer)
  }, [draftText, brief])

  return score
}
