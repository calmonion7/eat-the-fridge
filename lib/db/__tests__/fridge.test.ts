import { getFridgeItems, addFridgeItem, removeFridgeItem } from '../fridge'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const mockItem = {
  id: 'f1', user_id: 'u1', ingredient_id: 'i1',
  ingredients: { id: 'i1', name: '감자', category: '채소' },
}

describe('getFridgeItems', () => {
  it('returns items with ingredient details', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [mockItem], error: null }),
        }),
      }),
    } as any)
    expect(await getFridgeItems('u1')).toEqual([mockItem])
  })
})

describe('addFridgeItem', () => {
  it('inserts and returns new item', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
          }),
        }),
      }),
    } as any)
    expect(await addFridgeItem('u1', 'i1')).toEqual(mockItem)
  })
})

describe('removeFridgeItem', () => {
  it('resolves without error', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    } as any)
    await expect(removeFridgeItem('u1', 'i1')).resolves.toBeUndefined()
  })
})
