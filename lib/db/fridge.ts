import { createClient } from '@/lib/supabase/server'
import type { FridgeItem } from '@/lib/types'

export async function getFridgeItems(userId: string): Promise<FridgeItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fridge_items')
    .select('*, ingredients(id, name, category)')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function addFridgeItem(userId: string, ingredientId: string): Promise<FridgeItem> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fridge_items')
    .insert({ user_id: userId, ingredient_id: ingredientId })
    .select('*, ingredients(id, name, category)')
    .single()
  if (error) throw error
  return data
}

export async function removeFridgeItem(userId: string, ingredientId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fridge_items').delete().eq('user_id', userId).eq('ingredient_id', ingredientId)
  if (error) throw error
}
