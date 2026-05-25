import { createClient } from '@/lib/supabase/server'
import { getIngredients } from '@/lib/db/ingredients'
import RecipeForm from '@/components/admin/RecipeForm'
import RecipeTable from '@/components/admin/RecipeTable'
import CrawlButton from '@/components/admin/CrawlButton'
import AdminNav from '@/components/admin/AdminNav'
import type { Recipe } from '@/lib/types'

export default async function AdminRecipesPage() {
  const supabase = await createClient()
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, description, instructions, image_url, created_at')
    .order('created_at', { ascending: false })

  const allIngredients = await getIngredients()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">관리자</h1>
      <AdminNav active="recipes" />
      <CrawlButton />
      <RecipeForm allIngredients={allIngredients} />
      <RecipeTable recipes={(recipes ?? []) as Recipe[]} />
    </div>
  )
}
