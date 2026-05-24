import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getRecipeWithIngredients } from '@/lib/db/recipes'
import { isFavorite } from '@/lib/db/favorites'
import { createClient } from '@/lib/supabase/server'
import FavoriteButton from '@/components/FavoriteButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ingredients?: string }>
}

export default async function RecipeDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { ingredients } = await searchParams
  const selectedIds = new Set(ingredients ? ingredients.split(',') : [])

  const recipe = await getRecipeWithIngredients(id).catch(() => null)
  if (!recipe) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const favorited = user ? await isFavorite(user.id, id) : false

  const backUrl = ingredients ? `/recipes?ingredients=${ingredients}` : '/recipes'

  return (
    <div className="flex flex-col gap-6">
      <Link href={backUrl} className="text-sm text-stone-400 hover:text-orange-500 transition-colors">← 레시피 목록</Link>

      <div className="relative h-72 w-full rounded-2xl overflow-hidden">
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <span className="text-7xl">🍳</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{recipe.title}</h1>
          {recipe.description && <p className="text-stone-500 mt-1">{recipe.description}</p>}
        </div>
        {user && <FavoriteButton recipeId={id} userId={user.id} initialFavorited={favorited} />}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-3">재료</h2>
        <ul className="flex flex-wrap gap-2">
          {recipe.recipe_ingredients.map(ri => (
            <li key={ri.ingredient_id}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                selectedIds.has(ri.ingredient_id)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-stone-200 text-stone-700'
              }`}>
              {ri.ingredients.name}
              {ri.amount && ` ${ri.amount}${ri.unit ?? ''}`}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-3">조리 순서</h2>
        <ol className="flex flex-col gap-3">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <p className="text-stone-700 pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
