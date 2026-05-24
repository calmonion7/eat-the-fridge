export type Category = '채소' | '고기' | '유제품' | '양념' | '기타'

export interface Ingredient {
  id: string
  name: string
  category: Category
}

export interface Recipe {
  id: string
  title: string
  description: string | null
  instructions: string[]
  image_url: string | null
  created_at: string
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: {
    ingredient_id: string
    amount: string | null
    unit: string | null
    ingredients: Ingredient
  }[]
}

export interface RecipeWithMatch extends Recipe {
  match_count: number
  total_ingredients: number
}

export interface FridgeItem {
  id: string
  user_id: string
  ingredient_id: string
  ingredients: Ingredient
}

export interface Favorite {
  id: string
  user_id: string
  recipe_id: string
  recipes: Recipe
}
