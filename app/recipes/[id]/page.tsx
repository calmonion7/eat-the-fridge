import { notFound } from 'next/navigation'
import Image from 'next/image'
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

  return (
    <div className="flex flex-col gap-6">
      {recipe.image_url && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          {recipe.description && <p className="text-gray-600 mt-1">{recipe.description}</p>}
        </div>
        {user && <FavoriteButton recipeId={id} userId={user.id} initialFavorited={favorited} />}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">재료</h2>
        <ul className="flex flex-wrap gap-2">
          {recipe.recipe_ingredients.map(ri => (
            <li key={ri.ingredient_id}
              className={`text-sm px-3 py-1 rounded-full border ${
                selectedIds.has(ri.ingredient_id)
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300'
              }`}>
              {ri.ingredients.name}
              {ri.amount && ` ${ri.amount}${ri.unit ?? ''}`}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">조리 순서</h2>
        <ol className="flex flex-col gap-3">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-black text-white text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
