import { createClient } from '@/lib/supabase/server'
import type { RecipeWithIngredients, RecipeWithMatch } from '@/lib/types'

export async function searchRecipes(ingredientIds: string[]): Promise<RecipeWithMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_recipes_by_ingredients', {
    ingredient_ids: ingredientIds,
  })
  if (error) throw error
  return data
}

export async function getRecipeWithIngredients(id: string): Promise<RecipeWithIngredients> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(ingredient_id, amount, unit, ingredients(id, name, category))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createRecipe(
  recipe: { title: string; description: string; instructions: string[]; image_url?: string | null },
  recipeIngredients: { id: string; amount: string; unit: string }[]
): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('recipes').insert(recipe).select('id').single()
  if (error) throw error

  const rows = recipeIngredients.map(({ id, amount, unit }) => ({
    recipe_id: data.id,
    ingredient_id: id,
    amount,
    unit,
  }))
  const { error: riError } = await supabase.from('recipe_ingredients').insert(rows)
  if (riError) throw riError

  return data
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
