import { getIngredients } from '@/lib/db/ingredients'
import IngredientForm from '@/components/admin/IngredientForm'
import IngredientTable from '@/components/admin/IngredientTable'

export default async function AdminIngredientsPage() {
  const ingredients = await getIngredients()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">재료 관리</h1>
      <IngredientForm />
      <IngredientTable ingredients={ingredients} />
    </div>
  )
}
