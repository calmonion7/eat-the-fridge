import { getIngredients, searchIngredients, createIngredient, deleteIngredient } from '../ingredients'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

function makeChain(resolved: unknown) {
  const val = { data: null, error: null, ...(typeof resolved === 'object' ? resolved : {}) }
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue(val),
        ilike: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(val) }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue(val) }),
      }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue(val) }),
    }),
  }
}

describe('getIngredients', () => {
  it('returns ingredients', async () => {
    const mockData = [{ id: '1', name: '감자', category: '채소' }]
    mockCreateClient.mockResolvedValue(makeChain({ data: mockData }) as any)
    expect(await getIngredients()).toEqual(mockData)
  })

  it('throws on DB error', async () => {
    mockCreateClient.mockResolvedValue(makeChain({ data: null, error: { message: 'fail' } }) as any)
    await expect(getIngredients()).rejects.toThrow()
  })
})

describe('searchIngredients', () => {
  it('returns filtered results', async () => {
    const mockData = [{ id: '2', name: '당근', category: '채소' }]
    mockCreateClient.mockResolvedValue(makeChain({ data: mockData }) as any)
    expect(await searchIngredients('당')).toEqual(mockData)
  })
})

describe('createIngredient', () => {
  it('returns created ingredient', async () => {
    const mockData = { id: '3', name: '양파', category: '채소' }
    mockCreateClient.mockResolvedValue(makeChain({ data: mockData }) as any)
    expect(await createIngredient('양파', '채소')).toEqual(mockData)
  })
})

describe('deleteIngredient', () => {
  it('resolves without error', async () => {
    mockCreateClient.mockResolvedValue(makeChain({}) as any)
    await expect(deleteIngredient('1')).resolves.toBeUndefined()
  })
})
