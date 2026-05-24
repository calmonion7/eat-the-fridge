import { createClient } from '@/lib/supabase/server'
import { getFridgeItems } from '@/lib/db/fridge'
import { getIngredients } from '@/lib/db/ingredients'
import FridgeManager from '@/components/FridgeManager'

export default async function FridgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [fridgeItems, allIngredients] = await Promise.all([
    getFridgeItems(user!.id),
    getIngredients(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 냉장고</h1>
      <FridgeManager userId={user!.id} fridgeItems={fridgeItems} allIngredients={allIngredients} />
    </div>
  )
}
