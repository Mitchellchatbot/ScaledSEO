import { SerpResult } from '@/types'

const SERPER_URL = 'https://google.serper.dev/search'

export async function fetchSerp(keyword: string): Promise<SerpResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) throw new Error('SERPER_API_KEY is not set')

  const response = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: keyword, num: 10, gl: 'us', hl: 'en' }),
  })

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const organic: Array<Record<string, unknown>> = data.organic ?? []

  return organic.slice(0, 10).map((item, index) => ({
    position: (item.position as number) ?? index + 1,
    title: (item.title as string) ?? '',
    link: (item.link as string) ?? '',
    snippet: (item.snippet as string) ?? '',
    domain: extractDomain((item.link as string) ?? ''),
  }))
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
