import { createClient } from '@/lib/supabase/server'
import type { Ingredient } from '@/lib/types'

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ingredients').select('*').order('name')
  if (error) throw error
  return data
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients').select('*').ilike('name', `%${query}%`).order('name').limit(10)
  if (error) throw error
  return data
}

export async function createIngredient(name: string, category: string): Promise<Ingredient> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients').insert({ name, category }).select().single()
  if (error) throw error
  return data
}

export async function deleteIngredient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw error
}
