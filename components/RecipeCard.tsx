import Link from 'next/link'
import Image from 'next/image'
import type { RecipeWithMatch } from '@/lib/types'

interface Props { recipe: RecipeWithMatch }

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {recipe.image_url && (
        <div className="relative h-40 w-full">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
          )}
        </div>
        <span className="shrink-0 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
          재료 {recipe.match_count}/{recipe.total_ingredients}개 보유
        </span>
      </div>
    </Link>
  )
}
