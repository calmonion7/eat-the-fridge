'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      router.push('/')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); return }
      setMessage('가입 확인 이메일을 보냈어요. 이메일을 확인해주세요.')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">{mode === 'login' ? '로그인' : '회원가입'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="이메일" value={email}
          onChange={e => setEmail(e.target.value)} required
          className="border rounded px-3 py-2" />
        <input type="password" placeholder="비밀번호" value={password}
          onChange={e => setPassword(e.target.value)} required
          className="border rounded px-3 py-2" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        <button type="submit" className="bg-black text-white rounded py-2">
          {mode === 'login' ? '로그인' : '가입하기'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
        {' '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
          className="underline"
        >
          {mode === 'login' ? '회원가입' : '로그인'}
        </button>
      </p>
    </div>
  )
}
