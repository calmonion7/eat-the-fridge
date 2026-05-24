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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">냉장고 재료로 레시피 찾기</h1>
        <p className="text-gray-500 mt-1">갖고 있는 재료를 선택해주세요</p>
      </div>
      <IngredientPicker ingredients={ingredients} initialSelected={initialSelected} />
    </div>
  )
}
