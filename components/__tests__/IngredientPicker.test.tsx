import { render, screen, fireEvent } from '@testing-library/react'
import IngredientPicker from '../IngredientPicker'
import type { Ingredient } from '@/lib/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

const ingredients: Ingredient[] = [
  { id: '1', name: '감자', category: '채소' },
  { id: '2', name: '돼지고기', category: '고기' },
  { id: '3', name: '마늘', category: '채소' },
]

describe('IngredientPicker', () => {
  it('shows ingredients for the default category (채소)', () => {
    render(<IngredientPicker ingredients={ingredients} />)
    expect(screen.getByText('감자')).toBeInTheDocument()
    expect(screen.getByText('마늘')).toBeInTheDocument()
    expect(screen.queryByText('돼지고기')).not.toBeInTheDocument()
  })

  it('switches category on tab click', () => {
    render(<IngredientPicker ingredients={ingredients} />)
    fireEvent.click(screen.getByRole('button', { name: '고기' }))
    expect(screen.getByText('돼지고기')).toBeInTheDocument()
    expect(screen.queryByText('감자')).not.toBeInTheDocument()
  })

  it('toggles selection and shows badge', () => {
    render(<IngredientPicker ingredients={ingredients} />)
    fireEvent.click(screen.getByText('감자'))
    expect(screen.getAllByText('감자')).toHaveLength(2)
  })

  it('search button disabled until ingredient selected', () => {
    render(<IngredientPicker ingredients={ingredients} />)
    expect(screen.getByRole('button', { name: '레시피 찾기' })).toBeDisabled()
    fireEvent.click(screen.getByText('감자'))
    expect(screen.getByRole('button', { name: '레시피 찾기' })).not.toBeDisabled()
  })
})
