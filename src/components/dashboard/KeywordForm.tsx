'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function KeywordForm() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = keyword.trim()
    if (!trimmed) return

    setLoading(true)

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to start pipeline')
        setLoading(false)
        return
      }

      router.push(`/brief/${data.brief_id}`)
    } catch {
      toast.error('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Target keyword
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={loading}
          placeholder="e.g. best project management software"
          maxLength={200}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <p className="text-xs text-gray-400 mt-1">{keyword.length}/200</p>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Starting pipeline — this takes 30–60 seconds. You will be redirected automatically.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !keyword.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? 'Starting…' : 'Generate Brief'}
      </button>
    </form>
  )
}
