'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CrawlButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ added: number; skipped: number; failed: number } | null>(null)
  const router = useRouter()

  async function handleCrawl() {
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch('/api/admin/recipes/crawl', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      setStatus('done')
      router.refresh()
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-4">
      <div className="flex-1">
        <p className="text-sm font-medium">만개의레시피 인기 레시피 자동 가져오기</p>
        <p className="text-xs text-stone-500 mt-0.5">한 번에 5개씩 가져와요. 중복은 건너뜁니다.</p>
        {status === 'done' && result && (
          <p className="text-xs text-green-700 mt-1">
            추가 {result.added}개 · 중복 {result.skipped}개 · 실패 {result.failed}개
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-500 mt-1">가져오기에 실패했어요. 잠시 후 다시 시도해주세요.</p>
        )}
      </div>
      <button
        onClick={handleCrawl}
        disabled={status === 'loading'}
        className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? '가져오는 중...' : '자동 가져오기'}
      </button>
    </div>
  )
}
