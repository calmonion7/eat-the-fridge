import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crawlRecipeUrls, scrapeRecipe } from '@/lib/scraper'

export const maxDuration = 60

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const urls = await crawlRecipeUrls(5)
  const results = { added: 0, skipped: 0, failed: 0 }

  for (const url of urls) {
    try {
      const scraped = await scrapeRecipe(url)
      if (!scraped.title || scraped.instructions.length === 0) { results.failed++; continue }

      // 중복 확인
      const { data: existing } = await supabase
        .from('recipes').select('id').ilike('title', scraped.title).maybeSingle()
      if (existing) { results.skipped++; continue }

      // 재료 자동 생성
      const ingredientIds: Record<string, string> = {}
      for (const ing of scraped.ingredients) {
        if (!ing.name) continue
        const { data: found } = await supabase
          .from('ingredients').select('id').ilike('name', ing.name).maybeSingle()
        if (found) {
          ingredientIds[ing.name] = found.id
        } else {
          const { data: created } = await supabase
            .from('ingredients').insert({ name: ing.name, category: ing.category }).select('id').single()
          if (created) ingredientIds[ing.name] = created.id
        }
      }

      // 레시피 저장
      const { data: recipe, error } = await supabase
        .from('recipes')
        .insert({ title: scraped.title, description: scraped.description, instructions: scraped.instructions, image_url: scraped.image_url })
        .select('id').single()
      if (error || !recipe) { results.failed++; continue }

      const rows = scraped.ingredients
        .filter(i => ingredientIds[i.name])
        .map(i => ({ recipe_id: recipe.id, ingredient_id: ingredientIds[i.name], amount: i.amount, unit: i.unit }))
      if (rows.length > 0) await supabase.from('recipe_ingredients').insert(rows)

      results.added++
    } catch {
      results.failed++
    }
  }

  return NextResponse.json(results)
}
