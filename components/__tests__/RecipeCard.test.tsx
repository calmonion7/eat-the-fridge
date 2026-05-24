import { render, screen } from '@testing-library/react'
import RecipeCard from '../RecipeCard'
import type { RecipeWithMatch } from '@/lib/types'

const recipe: RecipeWithMatch = {
  id: 'r1', title: '된장찌개', description: '구수한 된장찌개',
  image_url: null, instructions: [], created_at: '',
  match_count: 3, total_ingredients: 5,
}

describe('RecipeCard', () => {
  it('renders title and match badge', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.getByText('된장찌개')).toBeInTheDocument()
    expect(screen.getByText('재료 3/5개 보유')).toBeInTheDocument()
  })

  it('links to recipe detail page', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/r1')
  })
})
