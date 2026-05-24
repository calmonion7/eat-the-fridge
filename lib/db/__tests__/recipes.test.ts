import { searchRecipes, getRecipeWithIngredients, createRecipe, deleteRecipe } from '../recipes'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('searchRecipes', () => {
  it('calls RPC with ingredient_ids and returns results', async () => {
    const mockData = [{ id: 'r1', title: '된장찌개', match_count: 3, total_ingredients: 5 }]
    const mockRpc = jest.fn().mockResolvedValue({ data: mockData, error: null })
    mockCreateClient.mockResolvedValue({ rpc: mockRpc } as any)

    const result = await searchRecipes(['i1', 'i2'])
    expect(mockRpc).toHaveBeenCalledWith('search_recipes_by_ingredients', {
      ingredient_ids: ['i1', 'i2'],
    })
    expect(result).toEqual(mockData)
  })

  it('throws on error', async () => {
    mockCreateClient.mockResolvedValue({
      rpc: jest.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
    } as any)
    await expect(searchRecipes(['i1'])).rejects.toThrow()
  })
})

describe('getRecipeWithIngredients', () => {
  it('returns recipe with nested recipe_ingredients', async () => {
    const mockData = { id: 'r1', title: '된장찌개', recipe_ingredients: [] }
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    } as any)
    expect(await getRecipeWithIngredients('r1')).toEqual(mockData)
  })
})

describe('deleteRecipe', () => {
  it('resolves without error', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any)
    await expect(deleteRecipe('r1')).resolves.toBeUndefined()
  })
})
