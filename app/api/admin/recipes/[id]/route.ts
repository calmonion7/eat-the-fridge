import { createClient } from '@/lib/supabase/server'
import { deleteRecipe } from '@/lib/db/recipes'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await deleteRecipe(id)
  return new NextResponse(null, { status: 204 })
}
