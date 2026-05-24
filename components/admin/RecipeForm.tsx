'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient } from '@/lib/types'

interface IngredientEntry { id: string; amount: string; unit: string }
interface Props { allIngredients: Ingredient[] }

export default function RecipeForm({ allIngredients }: Props) {
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState<string[]>([''])
  const [imageUrl, setImageUrl] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState<IngredientEntry[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleScrape() {
    if (!scrapeUrl) return
    setScraping(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/admin/recipes/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      if (!res.ok) throw new Error('스크래핑 실패')
      const data = await res.json()
      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      setInstructions(data.instructions?.length ? data.instructions : [''])
      setImageUrl(data.image_url ?? '')
      setRecipeIngredients(data.ingredients ?? [])
      router.refresh() // reload allIngredients in case new ones were added
    } catch {
      setScrapeError('레시피를 가져오지 못했어요. URL을 확인해주세요.')
    } finally {
      setScraping(false)
    }
  }

  function updateStep(i: number, val: string) {
    setInstructions(prev => prev.map((s, idx) => idx === i ? val : s))
  }

  function updateIngredient(i: number, field: keyof IngredientEntry, val: string) {
    setRecipeIngredients(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe: { title, description, instructions: instructions.filter(Boolean), image_url: imageUrl || null },
        ingredients: recipeIngredients,
      }),
    })
    setTitle(''); setDescription(''); setInstructions(['']); setImageUrl(''); setRecipeIngredients([])
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border rounded-lg p-4">
      <h2 className="font-semibold">새 레시피 추가</h2>

      <div className="flex flex-col gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-sm font-medium text-orange-800">URL로 자동 가져오기</p>
        <div className="flex gap-2">
          <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
            placeholder="레시피 URL 붙여넣기 (만개의레시피 등)"
            className="flex-1 border rounded px-3 py-2 text-sm" />
          <button type="button" onClick={handleScrape} disabled={scraping || !scrapeUrl}
            className="bg-orange-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50 whitespace-nowrap">
            {scraping ? '가져오는 중...' : '가져오기'}
          </button>
        </div>
        {scrapeError && <p className="text-red-500 text-xs">{scrapeError}</p>}
      </div>

      <input value={title} onChange={e => setTitle(e.target.value)} required
        placeholder="레시피 이름" className="border rounded px-3 py-2 text-sm" />
      <textarea value={description} onChange={e => setDescription(e.target.value)}
        placeholder="설명 (선택)" className="border rounded px-3 py-2 text-sm" rows={2} />
      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
        placeholder="이미지 URL (선택)" className="border rounded px-3 py-2 text-sm" />

      <div>
        <p className="text-sm font-medium mb-2">조리 순서</p>
        {instructions.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-sm text-gray-400">{i + 1}.</span>
            <input value={step} onChange={e => updateStep(i, e.target.value)} required
              placeholder={`${i + 1}단계`} className="flex-1 border rounded px-3 py-2 text-sm" />
            {instructions.length > 1 && (
              <button type="button" onClick={() => setInstructions(p => p.filter((_, idx) => idx !== i))}
                className="text-red-400 text-sm">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setInstructions(p => [...p, ''])}
          className="text-sm text-gray-500 hover:text-black">+ 단계 추가</button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">재료</p>
        {recipeIngredients.map((entry, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <select value={entry.id} onChange={e => updateIngredient(i, 'id', e.target.value)}
              className="border rounded px-2 py-1 text-sm">
              {allIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
            </select>
            <input value={entry.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)}
              placeholder="양" className="w-16 border rounded px-2 py-1 text-sm" />
            <input value={entry.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
              placeholder="단위" className="w-16 border rounded px-2 py-1 text-sm" />
            <button type="button" onClick={() => setRecipeIngredients(p => p.filter((_, idx) => idx !== i))}
              className="text-red-400 text-sm">✕</button>
          </div>
        ))}
        <button type="button"
          onClick={() => setRecipeIngredients(p => [...p, { id: allIngredients[0]?.id ?? '', amount: '', unit: '개' }])}
          className="text-sm text-gray-500 hover:text-black">+ 재료 추가</button>
      </div>

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2 rounded disabled:opacity-50 text-sm">
        레시피 저장
      </button>
    </form>
  )
}
