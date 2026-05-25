import { getIngredients } from '@/lib/db/ingredients'
import IngredientForm from '@/components/admin/IngredientForm'
import IngredientTable from '@/components/admin/IngredientTable'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminIngredientsPage() {
  const ingredients = await getIngredients()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">관리자</h1>
      <AdminNav active="ingredients" />
      <IngredientForm />
      <IngredientTable ingredients={ingredients} />
    </div>
  )
}
