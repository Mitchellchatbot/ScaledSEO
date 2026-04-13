import { GeneratedBrief } from '@/types'

export function BriefDisplay({ brief }: { brief: GeneratedBrief }) {
  return (
    <div className="space-y-6 text-sm">
      {/* H1 + Meta */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div>
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Recommended H1</span>
          <p className="mt-0.5 font-semibold text-gray-900">{brief.recommended_h1}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Meta Description</span>
          <p className="mt-0.5 text-gray-700">{brief.meta_description}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Target Word Count</span>
          <p className="mt-0.5 font-medium text-gray-900">{brief.target_word_count.toLocaleString()} words</p>
        </div>
      </div>

      {/* Outline */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Outline</h3>
        <div className="space-y-1.5">
          {brief.outline.map((item, i) => (
            <div
              key={i}
              className={`rounded-lg border p-2.5 ${
                item.level === 'h2'
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-100 bg-white ml-4'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`shrink-0 text-xs font-mono font-bold ${item.level === 'h2' ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.level.toUpperCase()}
                </span>
                <div>
                  <p className="font-medium text-gray-900 leading-snug">{item.text}</p>
                  {item.notes && (
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Required Keywords */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Required Keywords</h3>
        <div className="flex flex-wrap gap-1.5">
          {[...brief.required_keywords]
            .sort((a, b) => b.weight - a.weight)
            .map((kw) => (
              <span
                key={kw.term}
                title={`Use at least ${kw.min_occurrences}× (weight ${kw.weight}/10)`}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  kw.weight >= 8
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : kw.weight >= 5
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {kw.term}
                <span className="ml-1 opacity-60">×{kw.min_occurrences}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Entities */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Entities to Include</h3>
        <div className="flex flex-wrap gap-1.5">
          {brief.entities.map((entity) => (
            <span
              key={entity}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
            >
              {entity}
            </span>
          ))}
        </div>
      </div>

      {/* Competitor Insights */}
      {brief.competitor_insights && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Competitor Insights</h3>
          <p className="text-gray-600 leading-relaxed">{brief.competitor_insights}</p>
        </div>
      )}
    </div>
  )
}
