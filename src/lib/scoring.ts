import { GeneratedBrief, KeywordDetail, ScoringInput, ScoringResult } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countOccurrences(text: string, term: string): number {
  const regex = new RegExp(escapeRegex(term), 'gi')
  return (text.match(regex) ?? []).length
}

/** Jaccard-style word overlap between two strings, 0–1 */
function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function extractMarkdownLines(text: string, prefix: string): string[] {
  return text
    .split('\n')
    .filter((line) => line.trimStart().startsWith(prefix))
    .map((line) => line.replace(new RegExp(`^\\s*${escapeRegex(prefix)}\\s*`), '').trim())
}

// ─── Sub-scorers ──────────────────────────────────────────────────────────────

function scoreKeywords(
  draftLower: string,
  brief: GeneratedBrief
): { score: number; max: number; details: KeywordDetail[] } {
  const MAX = 40
  if (!brief.required_keywords.length) return { score: MAX, max: MAX, details: [] }

  const totalWeight = brief.required_keywords.reduce((sum, k) => sum + k.weight, 0)
  let weightedScore = 0
  const details: KeywordDetail[] = []

  for (const kw of brief.required_keywords) {
    const actual = countOccurrences(draftLower, kw.term)
    const ratio = Math.min(actual / Math.max(kw.min_occurrences, 1), 1)
    weightedScore += ratio * kw.weight
    details.push({
      term: kw.term,
      actual,
      min_required: kw.min_occurrences,
      weight: kw.weight,
      found: actual >= kw.min_occurrences,
    })
  }

  const normalised = totalWeight > 0 ? (weightedScore / totalWeight) * MAX : 0
  return { score: Math.round(normalised), max: MAX, details }
}

function scoreWordCount(
  draftText: string,
  target: number
): { score: number; max: number; actual: number; target: number } {
  const MAX = 15
  const actual = draftText.trim().split(/\s+/).filter(Boolean).length
  const ratio = target > 0 ? actual / target : 0

  let score: number
  if (ratio >= 0.9 && ratio <= 1.15) score = MAX
  else if (ratio > 1.15 && ratio <= 1.3) score = 10
  else if (ratio >= 0.7 && ratio < 0.9) score = 8
  else if (ratio > 1.3) score = 5
  else score = Math.round((ratio / 0.7) * 5)

  return { score, max: MAX, actual, target }
}

function scoreH1(
  draftText: string,
  recommendedH1: string
): { score: number; max: number; present: boolean; matched: boolean } {
  const MAX = 10
  const h1Lines = extractMarkdownLines(draftText, '# ')
    .filter((l) => !l.startsWith('#')) // exclude ## lines

  if (h1Lines.length === 0) return { score: 0, max: MAX, present: false, matched: false }
  if (h1Lines.length > 1) return { score: 0, max: MAX, present: true, matched: false }

  const overlap = wordOverlap(h1Lines[0], recommendedH1)
  if (overlap >= 0.6) return { score: MAX, max: MAX, present: true, matched: true }
  return { score: 5, max: MAX, present: true, matched: false }
}

function scoreH2s(
  draftText: string,
  brief: GeneratedBrief
): { score: number; max: number; found: string[]; missing: string[] } {
  const MAX = 15
  const outlineH2s = brief.outline.filter((o) => o.level === 'h2').map((o) => o.text)
  if (outlineH2s.length === 0) return { score: MAX, max: MAX, found: [], missing: [] }

  const draftH2s = extractMarkdownLines(draftText, '## ')
  const found: string[] = []
  const missing: string[] = []

  for (const required of outlineH2s) {
    const isFound = draftH2s.some((draftH2) => wordOverlap(draftH2, required) >= 0.5)
    if (isFound) found.push(required)
    else missing.push(required)
  }

  const score = Math.round((found.length / outlineH2s.length) * MAX)
  return { score, max: MAX, found, missing }
}

function scoreEntities(
  draftLower: string,
  brief: GeneratedBrief
): { score: number; max: number; found: string[]; missing: string[] } {
  const MAX = 20
  if (!brief.entities.length) return { score: MAX, max: MAX, found: [], missing: [] }

  const found: string[] = []
  const missing: string[] = []

  for (const entity of brief.entities) {
    if (draftLower.includes(entity.toLowerCase())) found.push(entity)
    else missing.push(entity)
  }

  const score = Math.round((found.length / brief.entities.length) * MAX)
  return { score, max: MAX, found, missing }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function calculateScore({ draftText, brief }: ScoringInput): ScoringResult {
  const draftLower = draftText.toLowerCase()

  const keywords = scoreKeywords(draftLower, brief)
  const wordCount = scoreWordCount(draftText, brief.target_word_count)
  const h1 = scoreH1(draftText, brief.recommended_h1)
  const h2 = scoreH2s(draftText, brief)
  const entities = scoreEntities(draftLower, brief)

  const total = Math.min(
    100,
    keywords.score + wordCount.score + h1.score + h2.score + entities.score
  )

  return {
    total,
    breakdown: { keywords, wordCount, h1, h2, entities },
  }
}
