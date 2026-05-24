'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient, Category } from '@/lib/types'

const CATEGORIES: Category[] = ['채소', '고기', '유제품', '양념', '기타']

interface Props {
  ingredients: Ingredient[]
  initialSelected?: string[]
}

export default function IngredientPicker({ ingredients, initialSelected = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('채소')
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const router = useRouter()

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visible = ingredients.filter(i => i.category === activeCategory)
  const selectedList = ingredients.filter(i => selected.has(i.id))

  return (
    <div className="flex flex-col gap-4">
      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedList.map(i => (
            <button key={i.id} onClick={() => toggle(i.id)}
              className="flex items-center gap-1 bg-orange-500 text-white text-sm px-3 py-1 rounded-full hover:bg-orange-600 transition-colors">
              <span>{i.name}</span><span>✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map(i => (
          <button key={i.id} onClick={() => toggle(i.id)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              selected.has(i.id)
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-stone-200 text-stone-700 hover:border-orange-300 hover:text-orange-600'
            }`}>
            {i.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push(`/recipes?ingredients=${Array.from(selected).join(',')}`)}
        disabled={selected.size === 0}
        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {selected.size > 0 ? `레시피 찾기 (${selected.size}개 선택됨)` : '레시피 찾기'}
      </button>
    </div>
  )
}
