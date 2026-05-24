'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  recipeId: string
  userId: string
  initialFavorited: boolean
}

export default function FavoriteButton({ recipeId, userId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
    }
    setFavorited(f => !f)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="text-2xl disabled:opacity-50"
      aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
      {favorited ? '♥' : '♡'}
    </button>
  )
}
