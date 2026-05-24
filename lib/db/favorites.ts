import { createClient } from '@/lib/supabase/server'
import type { Favorite } from '@/lib/types'

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, recipes(id, title, description, image_url, instructions, created_at)')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function isFavorite(userId: string, recipeId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites').select('id').eq('user_id', userId).eq('recipe_id', recipeId).single()
  return data !== null
}

export async function addFavorite(userId: string, recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
  if (error) throw error
}

export async function removeFavorite(userId: string, recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId)
  if (error) throw error
}
