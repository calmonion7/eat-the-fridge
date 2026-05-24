import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">🧊 냉털</Link>
      <div className="flex gap-4 text-sm items-center">
        {user ? (
          <>
            <Link href="/fridge" className="hover:underline">냉장고</Link>
            <Link href="/favorites" className="hover:underline">즐겨찾기</Link>
            {user.user_metadata?.role === 'admin' && (
              <Link href="/admin" className="hover:underline">관리자</Link>
            )}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-gray-500 hover:underline">로그아웃</button>
            </form>
          </>
        ) : (
          <Link href="/auth/login" className="hover:underline">로그인</Link>
        )}
      </div>
    </nav>
  )
}
