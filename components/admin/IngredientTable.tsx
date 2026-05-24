'use client'
import { useRouter } from 'next/navigation'
import type { Ingredient } from '@/lib/types'

interface Props { ingredients: Ingredient[] }

export default function IngredientTable({ ingredients }: Props) {
  const router = useRouter()

  async function handleDelete(id: string) {
    await fetch(`/api/admin/ingredients/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="pb-2">이름</th>
          <th className="pb-2">카테고리</th>
          <th className="pb-2"></th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map(i => (
          <tr key={i.id} className="border-b">
            <td className="py-2">{i.name}</td>
            <td className="py-2 text-gray-500">{i.category}</td>
            <td className="py-2 text-right">
              <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:underline">삭제</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
