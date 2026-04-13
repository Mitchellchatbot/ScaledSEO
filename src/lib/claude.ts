import Anthropic from '@anthropic-ai/sdk'
import { ExtractedContent, GeneratedBrief } from '@/types'

const MAX_CONTENT_CHARS = 2000
const MIN_VALID_EXTRACTIONS = 3

export async function generateBrief(
  keyword: string,
  extractedContent: ExtractedContent[]
): Promise<GeneratedBrief> {
  const validContent = extractedContent.filter(
    (c) => c.content && c.content.length > 200
  )

  if (validContent.length < MIN_VALID_EXTRACTIONS) {
    throw new Error(
      `Insufficient content extracted: only ${validContent.length} valid pages (minimum ${MIN_VALID_EXTRACTIONS} required)`
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6'

  const competitorSection = validContent
    .map((c, i) => {
      const truncated = c.content!.slice(0, MAX_CONTENT_CHARS)
      const ellipsis = c.content!.length > MAX_CONTENT_CHARS ? '\n[...truncated]' : ''
      return `---\n[COMPETITOR ${i + 1}] ${c.url} (${c.word_count} words)\n${truncated}${ellipsis}`
    })
    .join('\n\n')

  const userPrompt = `Keyword: "${keyword}"

I have analyzed the top ${validContent.length} ranking articles for this keyword. Here is their extracted content:

${competitorSection}

---

Based on this competitive analysis, produce a content brief as a JSON object with this exact schema:

{
  "recommended_h1": "string — a compelling, keyword-rich H1 for a new article",
  "meta_description": "string — 150–160 chars, includes keyword",
  "target_word_count": number,
  "outline": [
    { "level": "h2" | "h3", "text": "string", "notes": "string — what to cover in this section" }
  ],
  "required_keywords": [
    { "term": "string", "min_occurrences": number, "weight": number }
  ],
  "entities": ["string"],
  "competitor_insights": "string"
}

Rules:
- required_keywords: include the exact target keyword (weight 10), 4–8 semantically related terms (weight 3–8), and 2–3 long-tail variants (weight 2–5). Total: 8–15 terms.
- entities: extract brand names, product names, tool names, and important proper nouns that appear across multiple competitor articles.
- outline: minimum 5 H2s, maximum 10 H2s. Add H3s only where genuinely needed for sub-topics.
- target_word_count: calculate as the rounded average of competitor word counts, capped between 800 and 4000.
- weight scale: 1–10 where 10 is most important.`

  const brief = await callClaude(client, model, userPrompt)
  return brief
}

async function callClaude(
  client: Anthropic,
  model: string,
  userPrompt: string,
  isRetry = false
): Promise<GeneratedBrief> {
  const retryNote = isRetry
    ? '\n\nIMPORTANT: Your previous response was not valid JSON. Respond ONLY with the JSON object, nothing else.'
    : ''

  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    temperature: 0,
    system:
      'You are an expert SEO content strategist. You analyze competitor content and produce structured content briefs for writers. You ALWAYS respond with valid JSON only. No markdown fences, no prose outside the JSON object.',
    messages: [
      { role: 'user', content: userPrompt + retryNote },
    ],
  })

  const rawText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip markdown fences if Claude added them despite instructions
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed: GeneratedBrief
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    if (!isRetry) {
      return callClaude(client, model, userPrompt, true)
    }
    throw new Error(`Claude returned invalid JSON after retry: ${cleaned.slice(0, 200)}`)
  }

  return parsed
}
