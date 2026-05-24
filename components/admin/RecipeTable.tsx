'use client'
import { useRouter } from 'next/navigation'
import type { Recipe } from '@/lib/types'

interface Props { recipes: Recipe[] }

export default function RecipeTable({ recipes }: Props) {
  const router = useRouter()

  async function handleDelete(id: string) {
    await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left"><th className="pb-2">제목</th><th></th></tr>
      </thead>
      <tbody>
        {recipes.map(r => (
          <tr key={r.id} className="border-b">
            <td className="py-2">{r.title}</td>
            <td className="py-2 text-right">
              <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">삭제</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
