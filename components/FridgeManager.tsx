'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FridgeItem, Ingredient } from '@/lib/types'

interface Props {
  userId: string
  fridgeItems: FridgeItem[]
  allIngredients: Ingredient[]
}

export default function FridgeManager({ userId, fridgeItems: initial, allIngredients }: Props) {
  const [items, setItems] = useState(initial)
  const router = useRouter()
  const fridgeIds = new Set(items.map(f => f.ingredient_id))
  const available = allIngredients.filter(i => !fridgeIds.has(i.id))

  async function add(ingredient: Ingredient) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({ user_id: userId, ingredient_id: ingredient.id })
      .select('*, ingredients(id, name, category)')
      .single()
    if (!error && data) setItems(prev => [...prev, data as FridgeItem])
  }

  async function remove(ingredientId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('fridge_items').delete().eq('user_id', userId).eq('ingredient_id', ingredientId)
    if (!error) setItems(prev => prev.filter(f => f.ingredient_id !== ingredientId))
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-semibold mb-2">내 냉장고 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">재료를 추가해주세요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map(f => (
              <button key={f.ingredient_id} onClick={() => remove(f.ingredient_id)}
                className="flex items-center gap-1 bg-black text-white text-sm px-3 py-1 rounded-full">
                <span>{f.ingredients.name}</span><span>✕</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <button
          onClick={() => router.push(`/recipes?ingredients=${items.map(f => f.ingredient_id).join(',')}`)}
          className="bg-black text-white py-2 rounded-lg">
          이 재료로 레시피 찾기
        </button>
      )}

      <section>
        <h2 className="font-semibold mb-2">재료 추가</h2>
        <div className="flex flex-wrap gap-2">
          {available.map(i => (
            <button key={i.id} onClick={() => add(i)}
              className="text-sm px-3 py-1 rounded-full border border-gray-300 hover:border-black">
              + {i.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
