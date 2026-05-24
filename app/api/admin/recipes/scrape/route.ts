import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeRecipe } from '@/lib/scraper'
import type { Ingredient } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const scraped = await scrapeRecipe(url)

  // Auto-create missing ingredients
  const ingredientIds: Record<string, string> = {}
  for (const ing of scraped.ingredients) {
    if (!ing.name) continue
    const { data: existing } = await supabase
      .from('ingredients')
      .select('id')
      .ilike('name', ing.name)
      .single()

    if (existing) {
      ingredientIds[ing.name] = existing.id
    } else {
      const { data: created } = await supabase
        .from('ingredients')
        .insert({ name: ing.name, category: ing.category })
        .select('id')
        .single()
      if (created) ingredientIds[ing.name] = (created as Ingredient).id
    }
  }

  const ingredients = scraped.ingredients
    .filter(i => ingredientIds[i.name])
    .map(i => ({ id: ingredientIds[i.name], amount: i.amount, unit: i.unit }))

  return NextResponse.json({ ...scraped, ingredients })
}
