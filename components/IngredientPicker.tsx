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
              className="flex items-center gap-1 bg-black text-white text-sm px-3 py-1 rounded-full">
              <span>{i.name}</span><span>✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${
              activeCategory === cat ? 'border-black' : 'border-transparent text-gray-400'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map(i => (
          <button key={i.id} onClick={() => toggle(i.id)}
            className={`text-sm px-3 py-1 rounded-full border ${
              selected.has(i.id) ? 'bg-black text-white border-black' : 'border-gray-300'
            }`}>
            {i.name}
          </button>
        ))}
      </div>

      <button onClick={() => router.push(`/recipes?ingredients=${Array.from(selected).join(',')}`)}
        disabled={selected.size === 0}
        className="mt-2 bg-black text-white py-3 rounded-lg disabled:opacity-40">
        레시피 찾기
      </button>
    </div>
  )
}
