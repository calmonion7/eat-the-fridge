import { searchRecipes } from '@/lib/db/recipes'
import RecipeCard from '@/components/RecipeCard'
import ExactFilterToggle from '@/components/ExactFilterToggle'
import { Suspense } from 'react'

interface Props {
  searchParams: Promise<{ ingredients?: string; exact?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { ingredients, exact } = await searchParams
  const ids = ingredients ? ingredients.split(',').filter(Boolean) : []

  if (ids.length === 0) {
    return <p className="text-gray-500">재료를 선택한 후 검색해주세요.</p>
  }

  const allRecipes = await searchRecipes(ids)
  const recipes = exact === '1'
    ? allRecipes.filter(r => r.match_count === r.total_ingredients)
    : allRecipes

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">레시피 {recipes.length}개</h1>
        <Suspense>
          <ExactFilterToggle />
        </Suspense>
      </div>
      {recipes.length === 0 ? (
        <p className="text-gray-500">선택한 재료로 만들 수 있는 레시피가 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      )}
    </div>
  )
}
