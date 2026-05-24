'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ExactFilterToggle() {
  const router = useRouter()
  const params = useSearchParams()
  const exact = params.get('exact') === '1'

  function toggle() {
    const next = new URLSearchParams(params.toString())
    exact ? next.delete('exact') : next.set('exact', '1')
    router.push(`/recipes?${next.toString()}`)
  }

  return (
    <button onClick={toggle}
      className={`text-sm px-3 py-1 rounded-full border ${
        exact ? 'bg-black text-white border-black' : 'border-gray-300'
      }`}>
      내 재료로만 가능
    </button>
  )
}
