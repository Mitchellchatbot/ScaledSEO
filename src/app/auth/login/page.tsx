import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Brief Tool</h1>
          <p className="mt-2 text-gray-500">Sign in to generate content briefs</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-48 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
