// ─── SERP ────────────────────────────────────────────────────────────────────

export interface SerpResult {
  position: number
  title: string
  link: string
  snippet: string
  domain: string
}

// ─── Extracted Content ────────────────────────────────────────────────────────

export interface ExtractedContent {
  url: string
  title: string | null
  content: string | null
  word_count: number
  error: string | null
}

// ─── Generated Brief ─────────────────────────────────────────────────────────

export interface OutlineItem {
  level: 'h2' | 'h3'
  text: string
  notes: string
}

export interface RequiredKeyword {
  term: string
  min_occurrences: number
  weight: number
}

export interface GeneratedBrief {
  recommended_h1: string
  meta_description: string
  target_word_count: number
  outline: OutlineItem[]
  required_keywords: RequiredKeyword[]
  entities: string[]
  competitor_insights: string
}

// ─── Brief Row (Supabase) ─────────────────────────────────────────────────────

export type BriefStatus = 'pending' | 'processing' | 'complete' | 'error'

export interface BriefRow {
  id: string
  user_id: string
  keyword: string
  status: BriefStatus
  serp_results: SerpResult[] | null
  extracted_content: ExtractedContent[] | null
  generated_brief: GeneratedBrief | null
  draft_content: string | null
  last_score: number | null
  created_at: string
  updated_at: string
}

// Lightweight list view — no full JSONB blobs
export interface BriefListItem {
  id: string
  keyword: string
  status: BriefStatus
  last_score: number | null
  created_at: string
  target_word_count: number | null
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface KeywordDetail {
  term: string
  actual: number
  min_required: number
  weight: number
  found: boolean
}

export interface ScoringResult {
  total: number
  breakdown: {
    keywords: { score: number; max: number; details: KeywordDetail[] }
    wordCount: { score: number; max: number; actual: number; target: number }
    h1: { score: number; max: number; present: boolean; matched: boolean }
    h2: { score: number; max: number; found: string[]; missing: string[] }
    entities: { score: number; max: number; found: string[]; missing: string[] }
  }
}

export interface ScoringInput {
  draftText: string
  brief: GeneratedBrief
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface PipelineRequest {
  keyword: string
}

export interface PipelineResponse {
  brief_id: string
  status: BriefStatus
  error?: string
}

export interface SaveDraftRequest {
  draft_content: string
  last_score: number
}
