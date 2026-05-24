'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'

const CATEGORIES: Category[] = ['채소', '고기', '유제품', '양념', '기타']

export default function IngredientForm() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('채소')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    })
    setName('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">재료명</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          placeholder="예: 감자" className="border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">카테고리</label>
        <select value={category} onChange={e => setCategory(e.target.value as Category)}
          className="border rounded px-3 py-2 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}
        className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        추가
      </button>
    </form>
  )
}
