import Link from 'next/link'

interface Props { active: 'ingredients' | 'recipes' }

export default function AdminNav({ active }: Props) {
  return (
    <div className="flex gap-2 border-b">
      <Link href="/admin/ingredients"
        className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
          active === 'ingredients' ? 'border-orange-500 text-orange-500' : 'border-transparent text-stone-500 hover:text-stone-800'
        }`}>
        재료 관리
      </Link>
      <Link href="/admin/recipes"
        className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
          active === 'recipes' ? 'border-orange-500 text-orange-500' : 'border-transparent text-stone-500 hover:text-stone-800'
        }`}>
        레시피 관리
      </Link>
    </div>
  )
}
