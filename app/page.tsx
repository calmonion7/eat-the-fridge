import { getIngredients } from '@/lib/db/ingredients'
import { getFridgeItems } from '@/lib/db/fridge'
import { createClient } from '@/lib/supabase/server'
import IngredientPicker from '@/components/IngredientPicker'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [ingredients, fridgeItems] = await Promise.all([
    getIngredients(),
    user ? getFridgeItems(user.id) : Promise.resolve([]),
  ])

  const initialSelected = fridgeItems.map(f => f.ingredient_id)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">🍽️ 냉장고 재료로 레시피 찾기</h1>
        <p className="text-stone-500 mt-2 text-base">갖고 있는 재료를 선택하면 만들 수 있는 레시피를 추천해드려요</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-100">
        <IngredientPicker ingredients={ingredients} initialSelected={initialSelected} />
      </div>
    </div>
  )
}
