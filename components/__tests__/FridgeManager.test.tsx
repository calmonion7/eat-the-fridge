import { render, screen } from '@testing-library/react'
import FridgeManager from '../FridgeManager'
import type { Ingredient, FridgeItem } from '@/lib/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }),
    }),
  }),
}))

const allIngredients: Ingredient[] = [
  { id: 'i1', name: '감자', category: '채소' },
  { id: 'i2', name: '당근', category: '채소' },
]
const fridgeItems: FridgeItem[] = [
  { id: 'f1', user_id: 'u1', ingredient_id: 'i1', ingredients: allIngredients[0] },
]

describe('FridgeManager', () => {
  it('shows current fridge items', () => {
    render(<FridgeManager userId="u1" fridgeItems={fridgeItems} allIngredients={allIngredients} />)
    expect(screen.getByText('감자')).toBeInTheDocument()
  })

  it('shows non-fridge ingredients in the add section', () => {
    render(<FridgeManager userId="u1" fridgeItems={fridgeItems} allIngredients={allIngredients} />)
    expect(screen.getByText('+ 당근')).toBeInTheDocument()
  })
})
