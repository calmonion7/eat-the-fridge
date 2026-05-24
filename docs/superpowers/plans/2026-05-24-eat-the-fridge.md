# Eat the Fridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 PWA where users input fridge ingredients and get recipe recommendations matched from a PostgreSQL database, with user accounts for fridge saving and favorites.

**Architecture:** Next.js 15 App Router with React Server Components for all data fetching; client components only for interactive UI. Supabase handles PostgreSQL + Auth. Recipe matching uses a Supabase RPC function returning recipes sorted by ingredient match count.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@supabase/ssr`, `next-pwa`, Jest + React Testing Library

---

## File Map

```
eat-the-fridge/
├── app/
│   ├── layout.tsx                           # Root layout: font, navbar
│   ├── page.tsx                             # Home: ingredient picker + search
│   ├── recipes/
│   │   ├── page.tsx                         # Search results (?ingredients= param)
│   │   └── [id]/page.tsx                    # Recipe detail
│   ├── fridge/page.tsx                      # My fridge (auth-protected)
│   ├── favorites/page.tsx                   # Favorites (auth-protected)
│   ├── admin/
│   │   ├── page.tsx                         # Redirects to /admin/ingredients
│   │   ├── ingredients/page.tsx             # Ingredient CRUD
│   │   └── recipes/page.tsx                 # Recipe CRUD
│   ├── auth/
│   │   ├── login/page.tsx                   # Login page
│   │   └── logout/route.ts                  # Sign-out handler
│   └── api/admin/
│       ├── ingredients/route.ts             # POST create ingredient
│       ├── ingredients/[id]/route.ts        # DELETE ingredient
│       ├── recipes/route.ts                 # POST create recipe
│       └── recipes/[id]/route.ts            # DELETE recipe
├── components/
│   ├── Navbar.tsx                           # Server: nav + auth state
│   ├── IngredientPicker.tsx                 # Client: tabs + chips + badges + search
│   ├── RecipeCard.tsx                       # Recipe card with match badge
│   ├── ExactFilterToggle.tsx                # Client: "내 재료로만 가능" filter toggle
│   ├── FavoriteButton.tsx                   # Client: toggle favorite
│   ├── FridgeManager.tsx                    # Client: add/remove fridge ingredients
│   └── admin/
│       ├── IngredientForm.tsx               # Client: create ingredient form
│       ├── IngredientTable.tsx              # Client: ingredient list + delete
│       ├── RecipeForm.tsx                   # Client: create recipe form
│       └── RecipeTable.tsx                  # Client: recipe list + delete
├── lib/
│   ├── types.ts                             # All TypeScript types
│   ├── supabase/
│   │   ├── client.ts                        # Browser Supabase client
│   │   └── server.ts                        # Server Supabase client
│   └── db/
│       ├── ingredients.ts                   # Ingredient queries
│       ├── recipes.ts                       # Recipe queries + search RPC
│       ├── fridge.ts                        # Fridge queries
│       └── favorites.ts                     # Favorites queries
├── middleware.ts                            # Auth guard for protected routes
├── public/
│   ├── manifest.json                        # PWA manifest
│   └── icons/                              # icon-192.png, icon-512.png
├── supabase/
│   └── migrations/001_initial_schema.sql   # All tables + RPC function
├── next.config.ts
├── jest.config.ts
├── jest.setup.ts
└── .env.local.example
```

---

## Task 1: Project init + test setup

**Files:**
- Create: project scaffold, `jest.config.ts`, `jest.setup.ts`, `.env.local.example`

- [ ] **Step 1: Scaffold project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-pwa
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Step 3: Configure Jest**

Write `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

export default createJestConfig(config)
```

Write `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create .env.local.example**

Write `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Copy to `.env.local` and fill in your Supabase project values.

- [ ] **Step 5: Verify Jest works**

```bash
npx jest --passWithNoTests
```

Expected: `Test Suites: 0 passed`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: init Next.js 15 project with Jest"
```

---

## Task 2: TypeScript types + DB schema

**Files:**
- Create: `lib/types.ts`, `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write types**

Write `lib/types.ts`:
```typescript
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
```

- [ ] **Step 2: Write DB migration**

Write `supabase/migrations/001_initial_schema.sql`:
```sql
create extension if not exists "uuid-ossp";

create table ingredients (
  id       uuid primary key default uuid_generate_v4(),
  name     text not null,
  category text not null check (category in ('채소','고기','유제품','양념','기타'))
);

create table recipes (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  instructions text[] not null,
  image_url    text,
  created_at   timestamptz default now()
);

create table recipe_ingredients (
  recipe_id     uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  amount        text,
  unit          text,
  primary key (recipe_id, ingredient_id)
);

create table fridge_items (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  unique (user_id, ingredient_id)
);

create table favorites (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  unique (user_id, recipe_id)
);

-- Returns recipes sorted by how many of the given ingredients they use
create or replace function search_recipes_by_ingredients(ingredient_ids uuid[])
returns table (
  id                uuid,
  title             text,
  description       text,
  instructions      text[],
  image_url         text,
  created_at        timestamptz,
  match_count       bigint,
  total_ingredients bigint
) language sql as $$
  select
    r.id, r.title, r.description, r.instructions, r.image_url, r.created_at,
    count(case when ri.ingredient_id = any(ingredient_ids) then 1 end) as match_count,
    count(ri.ingredient_id) as total_ingredients
  from recipes r
  join recipe_ingredients ri on r.id = ri.recipe_id
  group by r.id
  having count(case when ri.ingredient_id = any(ingredient_ids) then 1 end) > 0
  order by
    match_count desc,
    (count(case when ri.ingredient_id = any(ingredient_ids) then 1 end)::float
      / count(ri.ingredient_id)) desc;
$$;

alter table fridge_items enable row level security;
create policy "Users manage own fridge" on fridge_items
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table favorites enable row level security;
create policy "Users manage own favorites" on favorites
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 3: Run migration**

Go to Supabase dashboard → SQL Editor → paste the migration file and run it.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts supabase/migrations/001_initial_schema.sql
git commit -m "feat: add TypeScript types and DB schema with search RPC"
```

---

## Task 3: Supabase clients + auth middleware

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`

- [ ] **Step 1: Write browser client**

Write `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server client**

Write `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write auth middleware**

Write `middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if ((pathname.startsWith('/fridge') || pathname.startsWith('/favorites')) && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/fridge/:path*', '/favorites/:path*', '/admin/:path*'],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat: add Supabase clients and auth middleware"
```

---

## Task 4: Ingredient data layer

**Files:**
- Create: `lib/db/ingredients.ts`, `lib/db/__tests__/ingredients.test.ts`

- [ ] **Step 1: Write failing tests**

Write `lib/db/__tests__/ingredients.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest lib/db/__tests__/ingredients.test.ts
```

Expected: FAIL — `Cannot find module '../ingredients'`

- [ ] **Step 3: Implement ingredient queries**

Write `lib/db/ingredients.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Ingredient } from '@/lib/types'

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ingredients').select('*').order('name')
  if (error) throw error
  return data
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients').select('*').ilike('name', `%${query}%`).order('name').limit(10)
  if (error) throw error
  return data
}

export async function createIngredient(name: string, category: string): Promise<Ingredient> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients').insert({ name, category }).select().single()
  if (error) throw error
  return data
}

export async function deleteIngredient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest lib/db/__tests__/ingredients.test.ts
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/db/ingredients.ts lib/db/__tests__/ingredients.test.ts
git commit -m "feat: add ingredient data layer"
```

---

## Task 5: Recipe data layer

**Files:**
- Create: `lib/db/recipes.ts`, `lib/db/__tests__/recipes.test.ts`

- [ ] **Step 1: Write failing tests**

Write `lib/db/__tests__/recipes.test.ts`:
```typescript
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
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest lib/db/__tests__/recipes.test.ts
```

Expected: FAIL — `Cannot find module '../recipes'`

- [ ] **Step 3: Implement recipe queries**

Write `lib/db/recipes.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { RecipeWithIngredients, RecipeWithMatch } from '@/lib/types'

export async function searchRecipes(ingredientIds: string[]): Promise<RecipeWithMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_recipes_by_ingredients', {
    ingredient_ids: ingredientIds,
  })
  if (error) throw error
  return data
}

export async function getRecipeWithIngredients(id: string): Promise<RecipeWithIngredients> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(ingredient_id, amount, unit, ingredients(id, name, category))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createRecipe(
  recipe: { title: string; description: string; instructions: string[]; image_url?: string | null },
  recipeIngredients: { id: string; amount: string; unit: string }[]
): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('recipes').insert(recipe).select('id').single()
  if (error) throw error

  const rows = recipeIngredients.map(({ id, amount, unit }) => ({
    recipe_id: data.id,
    ingredient_id: id,
    amount,
    unit,
  }))
  const { error: riError } = await supabase.from('recipe_ingredients').insert(rows)
  if (riError) throw riError

  return data
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest lib/db/__tests__/recipes.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/db/recipes.ts lib/db/__tests__/recipes.test.ts
git commit -m "feat: add recipe data layer with search RPC"
```

---

## Task 6: Fridge + Favorites data layer

**Files:**
- Create: `lib/db/fridge.ts`, `lib/db/favorites.ts`, `lib/db/__tests__/fridge.test.ts`, `lib/db/__tests__/favorites.test.ts`

- [ ] **Step 1: Write failing fridge tests**

Write `lib/db/__tests__/fridge.test.ts`:
```typescript
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
```

- [ ] **Step 2: Write failing favorites tests**

Write `lib/db/__tests__/favorites.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npx jest lib/db/__tests__/fridge.test.ts lib/db/__tests__/favorites.test.ts
```

Expected: FAIL — modules not found

- [ ] **Step 4: Implement fridge queries**

Write `lib/db/fridge.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { FridgeItem } from '@/lib/types'

export async function getFridgeItems(userId: string): Promise<FridgeItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fridge_items')
    .select('*, ingredients(id, name, category)')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function addFridgeItem(userId: string, ingredientId: string): Promise<FridgeItem> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fridge_items')
    .insert({ user_id: userId, ingredient_id: ingredientId })
    .select('*, ingredients(id, name, category)')
    .single()
  if (error) throw error
  return data
}

export async function removeFridgeItem(userId: string, ingredientId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fridge_items').delete().eq('user_id', userId).eq('ingredient_id', ingredientId)
  if (error) throw error
}
```

- [ ] **Step 5: Implement favorites queries**

Write `lib/db/favorites.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Favorite } from '@/lib/types'

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, recipes(id, title, description, image_url, instructions, created_at)')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function isFavorite(userId: string, recipeId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites').select('id').eq('user_id', userId).eq('recipe_id', recipeId).single()
  return data !== null
}

export async function addFavorite(userId: string, recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
  if (error) throw error
}

export async function removeFavorite(userId: string, recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId)
  if (error) throw error
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npx jest lib/db/__tests__/fridge.test.ts lib/db/__tests__/favorites.test.ts
```

Expected: 5 tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/db/fridge.ts lib/db/favorites.ts lib/db/__tests__/fridge.test.ts lib/db/__tests__/favorites.test.ts
git commit -m "feat: add fridge and favorites data layer"
```

---

## Task 7: Root layout + login/logout

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/Navbar.tsx`, `app/auth/login/page.tsx`, `app/auth/logout/route.ts`

- [ ] **Step 1: Write Navbar**

Write `components/Navbar.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">🧊 냉털</Link>
      <div className="flex gap-4 text-sm items-center">
        {user ? (
          <>
            <Link href="/fridge" className="hover:underline">냉장고</Link>
            <Link href="/favorites" className="hover:underline">즐겨찾기</Link>
            {user.user_metadata?.role === 'admin' && (
              <Link href="/admin" className="hover:underline">관리자</Link>
            )}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-gray-500 hover:underline">로그아웃</button>
            </form>
          </>
        ) : (
          <Link href="/auth/login" className="hover:underline">로그인</Link>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update root layout**

Write `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '냉털 — 냉장고 재료로 레시피 찾기',
  description: '냉장고에 있는 재료로 만들 수 있는 레시피를 추천해드립니다',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={geist.className}>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Write login page**

Write `app/auth/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="이메일" value={email}
          onChange={e => setEmail(e.target.value)} required
          className="border rounded px-3 py-2" />
        <input type="password" placeholder="비밀번호" value={password}
          onChange={e => setPassword(e.target.value)} required
          className="border rounded px-3 py-2" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white rounded py-2">로그인</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Write logout route**

Write `app/auth/logout/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/auth/ components/Navbar.tsx
git commit -m "feat: add root layout, navbar, login and logout"
```

---

## Task 8: IngredientPicker + home page

**Files:**
- Create: `components/IngredientPicker.tsx`, `components/__tests__/IngredientPicker.test.tsx`, `app/page.tsx`

- [ ] **Step 1: Write failing test**

Write `components/__tests__/IngredientPicker.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import IngredientPicker from '../IngredientPicker'
import type { Ingredient } from '@/lib/types'

// next/navigation mock required for useRouter
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
    // chip + badge = 2 occurrences
    expect(screen.getAllByText('감자')).toHaveLength(2)
  })

  it('search button disabled until ingredient selected', () => {
    render(<IngredientPicker ingredients={ingredients} />)
    expect(screen.getByRole('button', { name: '레시피 찾기' })).toBeDisabled()
    fireEvent.click(screen.getByText('감자'))
    expect(screen.getByRole('button', { name: '레시피 찾기' })).not.toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest components/__tests__/IngredientPicker.test.tsx
```

Expected: FAIL — `Cannot find module '../IngredientPicker'`

- [ ] **Step 3: Implement IngredientPicker**

Write `components/IngredientPicker.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient, Category } from '@/lib/types'

const CATEGORIES: Category[] = ['채소', '고기', '유제품', '양념', '기타']

interface Props {
  ingredients: Ingredient[]
  initialSelected?: string[]
}

export default function IngredientPicker({ ingredients, initialSelected = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('채소')
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const router = useRouter()

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visible = ingredients.filter(i => i.category === activeCategory)
  const selectedList = ingredients.filter(i => selected.has(i.id))

  return (
    <div className="flex flex-col gap-4">
      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedList.map(i => (
            <button key={i.id} onClick={() => toggle(i.id)}
              className="flex items-center gap-1 bg-black text-white text-sm px-3 py-1 rounded-full">
              {i.name} ✕
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${
              activeCategory === cat ? 'border-black' : 'border-transparent text-gray-400'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map(i => (
          <button key={i.id} onClick={() => toggle(i.id)}
            className={`text-sm px-3 py-1 rounded-full border ${
              selected.has(i.id) ? 'bg-black text-white border-black' : 'border-gray-300'
            }`}>
            {i.name}
          </button>
        ))}
      </div>

      <button onClick={() => router.push(`/recipes?ingredients=${Array.from(selected).join(',')}`)}
        disabled={selected.size === 0}
        className="mt-2 bg-black text-white py-3 rounded-lg disabled:opacity-40">
        레시피 찾기
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest components/__tests__/IngredientPicker.test.tsx
```

Expected: 4 tests pass

- [ ] **Step 5: Write home page**

Write `app/page.tsx`:
```tsx
import { getIngredients } from '@/lib/db/ingredients'
import { getFridgeItems } from '@/lib/db/fridge'
import { createClient } from '@/lib/supabase/server'
import IngredientPicker from '@/components/IngredientPicker'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [ingredients, fridgeItems] = await Promise.all([
    getIngredients(),
    user ? getFridgeItems(user.id) : Promise.resolve([]),
  ])

  const initialSelected = fridgeItems.map(f => f.ingredient_id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">냉장고 재료로 레시피 찾기</h1>
        <p className="text-gray-500 mt-1">갖고 있는 재료를 선택해주세요</p>
      </div>
      <IngredientPicker ingredients={ingredients} initialSelected={initialSelected} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/IngredientPicker.tsx components/__tests__/IngredientPicker.test.tsx
git commit -m "feat: add ingredient picker and home page"
```

---

## Task 9: RecipeCard + search results page

**Files:**
- Create: `components/RecipeCard.tsx`, `components/__tests__/RecipeCard.test.tsx`, `app/recipes/page.tsx`

- [ ] **Step 1: Write failing test**

Write `components/__tests__/RecipeCard.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest components/__tests__/RecipeCard.test.tsx
```

Expected: FAIL — `Cannot find module '../RecipeCard'`

- [ ] **Step 3: Implement RecipeCard**

Write `components/RecipeCard.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import type { RecipeWithMatch } from '@/lib/types'

interface Props { recipe: RecipeWithMatch }

export default function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {recipe.image_url && (
        <div className="relative h-40 w-full">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
          )}
        </div>
        <span className="shrink-0 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
          재료 {recipe.match_count}/{recipe.total_ingredients}개 보유
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest components/__tests__/RecipeCard.test.tsx
```

Expected: 2 tests pass

- [ ] **Step 5: Write search results page with filter toggle**

The filter toggle changes the `?exact=1` URL param. Use a client component for the toggle button so the server page can read the param and filter server-side.

Write `components/ExactFilterToggle.tsx`:
```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ExactFilterToggle() {
  const router = useRouter()
  const params = useSearchParams()
  const exact = params.get('exact') === '1'

  function toggle() {
    const next = new URLSearchParams(params.toString())
    exact ? next.delete('exact') : next.set('exact', '1')
    router.push(`/recipes?${next.toString()}`)
  }

  return (
    <button onClick={toggle}
      className={`text-sm px-3 py-1 rounded-full border ${
        exact ? 'bg-black text-white border-black' : 'border-gray-300'
      }`}>
      내 재료로만 가능
    </button>
  )
}
```

Write `app/recipes/page.tsx`:
```tsx
import { searchRecipes } from '@/lib/db/recipes'
import RecipeCard from '@/components/RecipeCard'
import ExactFilterToggle from '@/components/ExactFilterToggle'
import { Suspense } from 'react'

interface Props {
  searchParams: Promise<{ ingredients?: string; exact?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { ingredients, exact } = await searchParams
  const ids = ingredients ? ingredients.split(',').filter(Boolean) : []

  if (ids.length === 0) {
    return <p className="text-gray-500">재료를 선택한 후 검색해주세요.</p>
  }

  const allRecipes = await searchRecipes(ids)
  const recipes = exact === '1'
    ? allRecipes.filter(r => r.match_count === r.total_ingredients)
    : allRecipes

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">레시피 {recipes.length}개</h1>
        <Suspense>
          <ExactFilterToggle />
        </Suspense>
      </div>
      {recipes.length === 0 ? (
        <p className="text-gray-500">선택한 재료로 만들 수 있는 레시피가 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/RecipeCard.tsx components/__tests__/RecipeCard.test.tsx app/recipes/page.tsx
git commit -m "feat: add recipe card and search results page"
```

---

## Task 10: FavoriteButton + recipe detail page

**Files:**
- Create: `components/FavoriteButton.tsx`, `components/__tests__/FavoriteButton.test.tsx`, `app/recipes/[id]/page.tsx`

- [ ] **Step 1: Write failing test**

Write `components/__tests__/FavoriteButton.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest components/__tests__/FavoriteButton.test.tsx
```

Expected: FAIL — `Cannot find module '../FavoriteButton'`

- [ ] **Step 3: Implement FavoriteButton**

Write `components/FavoriteButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  recipeId: string
  userId: string
  initialFavorited: boolean
}

export default function FavoriteButton({ recipeId, userId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
    }
    setFavorited(f => !f)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="text-2xl disabled:opacity-50"
      aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
      {favorited ? '♥' : '♡'}
    </button>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest components/__tests__/FavoriteButton.test.tsx
```

Expected: 2 tests pass

- [ ] **Step 5: Write recipe detail page**

Write `app/recipes/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getRecipeWithIngredients } from '@/lib/db/recipes'
import { isFavorite } from '@/lib/db/favorites'
import { createClient } from '@/lib/supabase/server'
import FavoriteButton from '@/components/FavoriteButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ingredients?: string }>
}

export default async function RecipeDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { ingredients } = await searchParams
  const selectedIds = new Set(ingredients ? ingredients.split(',') : [])

  const recipe = await getRecipeWithIngredients(id).catch(() => null)
  if (!recipe) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const favorited = user ? await isFavorite(user.id, id) : false

  return (
    <div className="flex flex-col gap-6">
      {recipe.image_url && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          {recipe.description && <p className="text-gray-600 mt-1">{recipe.description}</p>}
        </div>
        {user && <FavoriteButton recipeId={id} userId={user.id} initialFavorited={favorited} />}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">재료</h2>
        <ul className="flex flex-wrap gap-2">
          {recipe.recipe_ingredients.map(ri => (
            <li key={ri.ingredient_id}
              className={`text-sm px-3 py-1 rounded-full border ${
                selectedIds.has(ri.ingredient_id)
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300'
              }`}>
              {ri.ingredients.name}
              {ri.amount && ` ${ri.amount}${ri.unit ?? ''}`}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">조리 순서</h2>
        <ol className="flex flex-col gap-3">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-black text-white text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/recipes/[id]/page.tsx components/FavoriteButton.tsx components/__tests__/FavoriteButton.test.tsx
git commit -m "feat: add recipe detail page with favorite button"
```

---

## Task 11: FridgeManager + fridge page

**Files:**
- Create: `components/FridgeManager.tsx`, `components/__tests__/FridgeManager.test.tsx`, `app/fridge/page.tsx`

- [ ] **Step 1: Write failing test**

Write `components/__tests__/FridgeManager.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest components/__tests__/FridgeManager.test.tsx
```

Expected: FAIL — `Cannot find module '../FridgeManager'`

- [ ] **Step 3: Implement FridgeManager**

Write `components/FridgeManager.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FridgeItem, Ingredient } from '@/lib/types'

interface Props {
  userId: string
  fridgeItems: FridgeItem[]
  allIngredients: Ingredient[]
}

export default function FridgeManager({ userId, fridgeItems: initial, allIngredients }: Props) {
  const [items, setItems] = useState(initial)
  const router = useRouter()
  const fridgeIds = new Set(items.map(f => f.ingredient_id))
  const available = allIngredients.filter(i => !fridgeIds.has(i.id))

  async function add(ingredient: Ingredient) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({ user_id: userId, ingredient_id: ingredient.id })
      .select('*, ingredients(id, name, category)')
      .single()
    if (!error && data) setItems(prev => [...prev, data as FridgeItem])
  }

  async function remove(ingredientId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('fridge_items').delete().eq('user_id', userId).eq('ingredient_id', ingredientId)
    if (!error) setItems(prev => prev.filter(f => f.ingredient_id !== ingredientId))
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-semibold mb-2">내 냉장고 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">재료를 추가해주세요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map(f => (
              <button key={f.ingredient_id} onClick={() => remove(f.ingredient_id)}
                className="flex items-center gap-1 bg-black text-white text-sm px-3 py-1 rounded-full">
                {f.ingredients.name} ✕
              </button>
            ))}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <button
          onClick={() => router.push(`/recipes?ingredients=${items.map(f => f.ingredient_id).join(',')}`)}
          className="bg-black text-white py-2 rounded-lg">
          이 재료로 레시피 찾기
        </button>
      )}

      <section>
        <h2 className="font-semibold mb-2">재료 추가</h2>
        <div className="flex flex-wrap gap-2">
          {available.map(i => (
            <button key={i.id} onClick={() => add(i)}
              className="text-sm px-3 py-1 rounded-full border border-gray-300 hover:border-black">
              + {i.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest components/__tests__/FridgeManager.test.tsx
```

Expected: 2 tests pass

- [ ] **Step 5: Write fridge page**

Write `app/fridge/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { getFridgeItems } from '@/lib/db/fridge'
import { getIngredients } from '@/lib/db/ingredients'
import FridgeManager from '@/components/FridgeManager'

export default async function FridgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [fridgeItems, allIngredients] = await Promise.all([
    getFridgeItems(user!.id),
    getIngredients(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 냉장고</h1>
      <FridgeManager userId={user!.id} fridgeItems={fridgeItems} allIngredients={allIngredients} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/fridge/page.tsx components/FridgeManager.tsx components/__tests__/FridgeManager.test.tsx
git commit -m "feat: add fridge management page"
```

---

## Task 12: Favorites page

**Files:**
- Create: `app/favorites/page.tsx`

- [ ] **Step 1: Write favorites page**

Write `app/favorites/page.tsx`:
```tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getFavorites } from '@/lib/db/favorites'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const favorites = await getFavorites(user!.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">즐겨찾기 ({favorites.length})</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">즐겨찾기한 레시피가 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(fav => (
            <Link key={fav.id} href={`/recipes/${fav.recipe_id}`}
              className="block border rounded-lg overflow-hidden hover:shadow-md">
              {fav.recipes.image_url && (
                <div className="relative h-40 w-full">
                  <Image src={fav.recipes.image_url} alt={fav.recipes.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{fav.recipes.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/favorites/page.tsx
git commit -m "feat: add favorites page"
```

---

## Task 13: Admin — ingredient management

**Files:**
- Create: `app/admin/page.tsx`, `app/admin/ingredients/page.tsx`, `components/admin/IngredientForm.tsx`, `components/admin/IngredientTable.tsx`, `app/api/admin/ingredients/route.ts`, `app/api/admin/ingredients/[id]/route.ts`

- [ ] **Step 1: Write API route — create ingredient**

Write `app/api/admin/ingredients/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, category } = await req.json()
  const { data, error } = await supabase.from('ingredients').insert({ name, category }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Write API route — delete ingredient**

Write `app/api/admin/ingredients/[id]/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Write IngredientForm**

Write `components/admin/IngredientForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'

const CATEGORIES: Category[] = ['채소', '고기', '유제품', '양념', '기타']

export default function IngredientForm() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('채소')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    })
    setName('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">재료명</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          placeholder="예: 감자" className="border rounded px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">카테고리</label>
        <select value={category} onChange={e => setCategory(e.target.value as Category)}
          className="border rounded px-3 py-2 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}
        className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        추가
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Write IngredientTable**

Write `components/admin/IngredientTable.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import type { Ingredient } from '@/lib/types'

interface Props { ingredients: Ingredient[] }

export default function IngredientTable({ ingredients }: Props) {
  const router = useRouter()

  async function handleDelete(id: string) {
    await fetch(`/api/admin/ingredients/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="pb-2">이름</th>
          <th className="pb-2">카테고리</th>
          <th className="pb-2"></th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map(i => (
          <tr key={i.id} className="border-b">
            <td className="py-2">{i.name}</td>
            <td className="py-2 text-gray-500">{i.category}</td>
            <td className="py-2 text-right">
              <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:underline">삭제</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 5: Write admin ingredients page + redirect**

Write `app/admin/ingredients/page.tsx`:
```tsx
import { getIngredients } from '@/lib/db/ingredients'
import IngredientForm from '@/components/admin/IngredientForm'
import IngredientTable from '@/components/admin/IngredientTable'

export default async function AdminIngredientsPage() {
  const ingredients = await getIngredients()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">재료 관리</h1>
      <IngredientForm />
      <IngredientTable ingredients={ingredients} />
    </div>
  )
}
```

Write `app/admin/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
export default function AdminPage() { redirect('/admin/ingredients') }
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/ app/api/admin/ingredients/ components/admin/IngredientForm.tsx components/admin/IngredientTable.tsx
git commit -m "feat: add admin ingredient management"
```

---

## Task 14: Admin — recipe management

**Files:**
- Create: `app/admin/recipes/page.tsx`, `components/admin/RecipeForm.tsx`, `components/admin/RecipeTable.tsx`, `app/api/admin/recipes/route.ts`, `app/api/admin/recipes/[id]/route.ts`

- [ ] **Step 1: Write API route — create recipe**

Write `app/api/admin/recipes/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createRecipe } from '@/lib/db/recipes'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { recipe, ingredients } = await req.json()
  try {
    const data = await createRecipe(recipe, ingredients)
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
```

- [ ] **Step 2: Write API route — delete recipe**

Write `app/api/admin/recipes/[id]/route.ts`:
```typescript
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
```

- [ ] **Step 3: Write RecipeTable**

Write `components/admin/RecipeTable.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import type { Recipe } from '@/lib/types'

interface Props { recipes: Recipe[] }

export default function RecipeTable({ recipes }: Props) {
  const router = useRouter()

  async function handleDelete(id: string) {
    await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left"><th className="pb-2">제목</th><th></th></tr>
      </thead>
      <tbody>
        {recipes.map(r => (
          <tr key={r.id} className="border-b">
            <td className="py-2">{r.title}</td>
            <td className="py-2 text-right">
              <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">삭제</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Write RecipeForm**

Write `components/admin/RecipeForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient } from '@/lib/types'

interface IngredientEntry { id: string; amount: string; unit: string }
interface Props { allIngredients: Ingredient[] }

export default function RecipeForm({ allIngredients }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState<string[]>([''])
  const [imageUrl, setImageUrl] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState<IngredientEntry[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function updateStep(i: number, val: string) {
    setInstructions(prev => prev.map((s, idx) => idx === i ? val : s))
  }

  function updateIngredient(i: number, field: keyof IngredientEntry, val: string) {
    setRecipeIngredients(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe: { title, description, instructions: instructions.filter(Boolean), image_url: imageUrl || null },
        ingredients: recipeIngredients,
      }),
    })
    setTitle(''); setDescription(''); setInstructions(['']); setImageUrl(''); setRecipeIngredients([])
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border rounded-lg p-4">
      <h2 className="font-semibold">새 레시피 추가</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} required
        placeholder="레시피 이름" className="border rounded px-3 py-2 text-sm" />
      <textarea value={description} onChange={e => setDescription(e.target.value)}
        placeholder="설명 (선택)" className="border rounded px-3 py-2 text-sm" rows={2} />
      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
        placeholder="이미지 URL (선택)" className="border rounded px-3 py-2 text-sm" />

      <div>
        <p className="text-sm font-medium mb-2">조리 순서</p>
        {instructions.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-sm text-gray-400">{i + 1}.</span>
            <input value={step} onChange={e => updateStep(i, e.target.value)} required
              placeholder={`${i + 1}단계`} className="flex-1 border rounded px-3 py-2 text-sm" />
            {instructions.length > 1 && (
              <button type="button" onClick={() => setInstructions(p => p.filter((_, idx) => idx !== i))}
                className="text-red-400 text-sm">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setInstructions(p => [...p, ''])}
          className="text-sm text-gray-500 hover:text-black">+ 단계 추가</button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">재료</p>
        {recipeIngredients.map((entry, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <select value={entry.id} onChange={e => updateIngredient(i, 'id', e.target.value)}
              className="border rounded px-2 py-1 text-sm">
              {allIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
            </select>
            <input value={entry.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)}
              placeholder="양" className="w-16 border rounded px-2 py-1 text-sm" />
            <input value={entry.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
              placeholder="단위" className="w-16 border rounded px-2 py-1 text-sm" />
            <button type="button" onClick={() => setRecipeIngredients(p => p.filter((_, idx) => idx !== i))}
              className="text-red-400 text-sm">✕</button>
          </div>
        ))}
        <button type="button"
          onClick={() => setRecipeIngredients(p => [...p, { id: allIngredients[0]?.id ?? '', amount: '', unit: '개' }])}
          className="text-sm text-gray-500 hover:text-black">+ 재료 추가</button>
      </div>

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2 rounded disabled:opacity-50 text-sm">
        레시피 저장
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Write admin recipes page**

Write `app/admin/recipes/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { getIngredients } from '@/lib/db/ingredients'
import RecipeForm from '@/components/admin/RecipeForm'
import RecipeTable from '@/components/admin/RecipeTable'
import type { Recipe } from '@/lib/types'

export default async function AdminRecipesPage() {
  const supabase = await createClient()
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, description, instructions, image_url, created_at')
    .order('created_at', { ascending: false })

  const allIngredients = await getIngredients()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">레시피 관리</h1>
      <RecipeForm allIngredients={allIngredients} />
      <RecipeTable recipes={(recipes ?? []) as Recipe[]} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/recipes/ app/api/admin/recipes/ components/admin/RecipeForm.tsx components/admin/RecipeTable.tsx
git commit -m "feat: add admin recipe management"
```

---

## Task 15: PWA configuration

**Files:**
- Modify: `next.config.ts`
- Create: `public/manifest.json`

- [ ] **Step 1: Update next.config.ts**

Write `next.config.ts`:
```typescript
import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 2: Create PWA manifest**

Write `public/manifest.json`:
```json
{
  "name": "냉털 — 냉장고 재료로 레시피 찾기",
  "short_name": "냉털",
  "description": "냉장고 재료로 만들 수 있는 레시피를 추천해드립니다",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Add PWA icons**

Create `public/icons/` directory and add two PNG files: `icon-192.png` (192×192) and `icon-512.png` (512×512). Any solid-color image works for development. For production, use a proper icon.

```bash
mkdir -p public/icons
# Use any image editor, or if ImageMagick is available:
# convert -size 192x192 xc:#000000 public/icons/icon-192.png
# convert -size 512x512 xc:#000000 public/icons/icon-512.png
```

- [ ] **Step 4: Verify production build**

```bash
npm run build
```

Expected: Build succeeds. Service worker files (`sw.js`, `workbox-*.js`) appear in `public/`.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts public/manifest.json public/icons/
git commit -m "feat: configure PWA with manifest and service worker"
```

---

## Task 16: Final verification + push

- [ ] **Step 1: Run full test suite**

```bash
npx jest --coverage
```

Expected: All tests pass. Coverage report printed.

- [ ] **Step 2: Start dev server and smoke test**

```bash
npm run dev
```

Verify each route manually:

| Route | Check |
|-------|-------|
| `http://localhost:3000` | Ingredient tabs load, chips clickable, "레시피 찾기" disabled until selection |
| `http://localhost:3000/recipes?ingredients=<id>` | Recipe cards with match badges visible |
| `http://localhost:3000/recipes/<id>` | Ingredients highlighted, steps listed |
| `http://localhost:3000/fridge` | Redirects to `/auth/login` when logged out |
| `http://localhost:3000/favorites` | Redirects to `/auth/login` when logged out |
| `http://localhost:3000/admin` | Redirects to `/auth/login` when logged out |
| `http://localhost:3000/auth/login` | Login form submits correctly |

- [ ] **Step 3: Set admin role in Supabase**

To create an admin user, go to Supabase dashboard → Authentication → Users → select your user → edit `raw_user_meta_data` to add `{"role": "admin"}`.

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin main
```

---

*Spec: `docs/superpowers/specs/2026-05-24-eat-the-fridge-design.md`*
