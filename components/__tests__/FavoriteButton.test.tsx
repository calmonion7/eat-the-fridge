import { render, screen } from '@testing-library/react'
import FavoriteButton from '../FavoriteButton'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }),
    }),
  }),
}))

describe('FavoriteButton', () => {
  it('shows ♥ when favorited', () => {
    render(<FavoriteButton recipeId="r1" userId="u1" initialFavorited={true} />)
    expect(screen.getByRole('button')).toHaveTextContent('♥')
  })

  it('shows ♡ when not favorited', () => {
    render(<FavoriteButton recipeId="r1" userId="u1" initialFavorited={false} />)
    expect(screen.getByRole('button')).toHaveTextContent('♡')
  })
})
