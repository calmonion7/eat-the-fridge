import { getFavorites, isFavorite, addFavorite, removeFavorite } from '../favorites'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const mockFav = {
  id: 'fav1', user_id: 'u1', recipe_id: 'r1',
  recipes: { id: 'r1', title: '된장찌개', description: null, instructions: [], image_url: null, created_at: '' },
}

describe('getFavorites', () => {
  it('returns favorites with recipe details', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [mockFav], error: null }),
        }),
      }),
    } as any)
    expect(await getFavorites('u1')).toEqual([mockFav])
  })
})

describe('isFavorite', () => {
  it('returns true when favorited', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockFav, error: null }),
            }),
          }),
        }),
      }),
    } as any)
    expect(await isFavorite('u1', 'r1')).toBe(true)
  })

  it('returns false when not favorited', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      }),
    } as any)
    expect(await isFavorite('u1', 'r1')).toBe(false)
  })
})
