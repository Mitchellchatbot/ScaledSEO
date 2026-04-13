import { KeywordForm } from '@/components/dashboard/KeywordForm'

export default function NewBriefPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Content Brief</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter a keyword to analyze the top 10 Google results and generate an AI-powered content brief.
        </p>
      </div>
      <KeywordForm />
    </div>
  )
}
