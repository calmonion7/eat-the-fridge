import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-xl text-stone-900 tracking-tight">🧊 냉털</Link>
      <div className="flex gap-5 text-sm items-center">
        {user ? (
          <>
            <Link href="/fridge" className="text-stone-600 hover:text-orange-500 transition-colors">냉장고</Link>
            <Link href="/favorites" className="text-stone-600 hover:text-orange-500 transition-colors">즐겨찾기</Link>
            {user.user_metadata?.role === 'admin' && (
              <Link href="/admin" className="text-stone-600 hover:text-orange-500 transition-colors">관리자</Link>
            )}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-stone-400 hover:text-stone-600 transition-colors">로그아웃</button>
            </form>
          </>
        ) : (
          <Link href="/auth/login" className="text-stone-600 hover:text-orange-500 transition-colors">로그인</Link>
        )}
      </div>
    </nav>
  )
}
