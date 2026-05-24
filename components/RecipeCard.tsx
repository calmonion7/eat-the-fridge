import Link from 'next/link'
import Image from 'next/image'
import type { RecipeWithMatch } from '@/lib/types'

interface Props { recipe: RecipeWithMatch }

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
      <div className="relative h-44 w-full">
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <span className="text-5xl">🍳</span>
          </div>
        )}
        <span className="absolute top-3 right-3 text-xs bg-orange-500 text-white px-2 py-1 rounded-full whitespace-nowrap font-medium shadow-sm">
          재료 {recipe.match_count}/{recipe.total_ingredients}개 보유
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-sm text-stone-500 mt-1 line-clamp-2">{recipe.description}</p>
        )}
      </div>
    </Link>
  )
}
