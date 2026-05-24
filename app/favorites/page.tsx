import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getFavorites } from '@/lib/db/favorites'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const favorites = await getFavorites(user!.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">즐겨찾기 ({favorites.length})</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">즐겨찾기한 레시피가 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(fav => (
            <Link key={fav.id} href={`/recipes/${fav.recipe_id}`}
              className="block border rounded-lg overflow-hidden hover:shadow-md">
              {fav.recipes.image_url && (
                <div className="relative h-40 w-full">
                  <Image src={fav.recipes.image_url} alt={fav.recipes.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{fav.recipes.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
