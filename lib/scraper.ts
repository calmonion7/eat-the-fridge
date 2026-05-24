import * as cheerio from 'cheerio'
import type { Category } from '@/lib/types'

export interface ScrapedIngredient {
  name: string
  amount: string
  unit: string
  category: Category
}

export interface ScrapedRecipe {
  title: string
  description: string
  instructions: string[]
  image_url: string | null
  ingredients: ScrapedIngredient[]
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  '채소': ['감자', '고구마', '양파', '대파', '마늘', '당근', '애호박', '브로콜리', '시금치', '배추', '무', '버섯', '토마토', '오이', '파프리카', '상추', '깻잎', '고추', '파', '셀러리', '가지', '콩나물', '숙주', '부추', '쪽파', '생강', '연근', '우엉', '도라지', '고사리', '미나리', '열무'],
  '고기': ['돼지', '닭', '소고기', '쇠고기', '베이컨', '소시지', '참치', '연어', '오징어', '새우', '게', '조개', '바지락', '꽃게', '멸치', '굴', '전복', '문어', '낙지', '명태', '동태', '코다리', '삼겹살', '목살', '갈비', '불고기', '다짐육'],
  '유제품': ['계란', '우유', '버터', '치즈', '크림', '두부', '요거트', '두유', '생크림', '모짜렐라'],
  '양념': ['소금', '설탕', '간장', '된장', '고추장', '참기름', '식용유', '식초', '고춧가루', '후추', '올리브유', '케첩', '마요네즈', '굴소스', '청주', '맛술', '다시다', '미원', '치킨스톡', '쌈장', '쯔유', '폰즈', '핫소스', '머스타드', '커리'],
  '기타': ['밥', '쌀', '라면', '파스타', '국수', '당면', '김', '김치', '두유', '빵', '밀가루', '전분', '베이킹', '설탕', '물엿', '올리고당', '참깨', '땅콩', '호두', '잣'],
}

function detectCategory(name: string): Category {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => name.includes(kw))) {
      return category as Category
    }
  }
  return '기타'
}

const UNITS = ['개', 'g', 'kg', 'ml', 'L', '리터', '큰술', '작은술', '컵', '줌', '장', '봉지', '캔', '쪽', '대', '모', '묶음', '포기', '조각', '마리', '인분', 'cc', 'T', 't', '꼬집', '약간', '조금', '적당량']

function parseIngredientString(str: string): { name: string; amount: string; unit: string } {
  const cleaned = str.replace(/\(.*?\)/g, '').trim()
  const unitPattern = new RegExp(`([\\d/.~-]+)\\s*(${UNITS.join('|')})`)
  const match = cleaned.match(unitPattern)

  if (match) {
    const name = cleaned.replace(match[0], '').replace(/[\s,·:]+/g, ' ').trim()
    return { name: name || cleaned, amount: match[1], unit: match[2] }
  }

  // Check for special amounts without units (약간, 적당량)
  for (const unit of ['약간', '조금', '적당량']) {
    if (cleaned.includes(unit)) {
      const name = cleaned.replace(unit, '').trim()
      return { name: name || cleaned, amount: '', unit }
    }
  }

  return { name: cleaned, amount: '', unit: '' }
}

function extractFromJsonLd($: cheerio.CheerioAPI): Partial<ScrapedRecipe> | null {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() ?? '')
      const recipe = Array.isArray(data) ? data.find((d: { '@type': string }) => d['@type'] === 'Recipe') : data['@type'] === 'Recipe' ? data : null
      if (!recipe) continue

      const title = recipe.name ?? ''
      const description = recipe.description ?? ''
      const image_url = Array.isArray(recipe.image) ? recipe.image[0]?.url ?? recipe.image[0] : recipe.image?.url ?? recipe.image ?? null
      const rawIngredients: string[] = recipe.recipeIngredient ?? []
      const rawInstructions = recipe.recipeInstructions ?? []

      const instructions: string[] = rawInstructions.map((step: string | { text: string }) =>
        typeof step === 'string' ? step : step.text ?? ''
      ).filter(Boolean)

      const ingredients: ScrapedIngredient[] = rawIngredients.map((raw: string) => {
        const { name, amount, unit } = parseIngredientString(raw)
        return { name, amount, unit, category: detectCategory(name) }
      }).filter((i: ScrapedIngredient) => i.name)

      if (title && instructions.length > 0) {
        return { title, description, image_url, instructions, ingredients }
      }
    } catch { continue }
  }
  return null
}

function extractGeneric($: cheerio.CheerioAPI, url: string): Partial<ScrapedRecipe> {
  const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || ''
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
  const image_url = $('meta[property="og:image"]').attr('content') || null

  // 만개의레시피 specific
  if (url.includes('10000recipe.com')) {
    const instructions: string[] = []
    $('.view_step_cont').each((_, el) => {
      const text = $(el).text().trim()
      if (text) instructions.push(text)
    })
    const ingredients: ScrapedIngredient[] = []
    $('.ready_ingre3 li').each((_, el) => {
      const raw = $(el).text().replace(/\s+/g, ' ').trim()
      if (raw) {
        const { name, amount, unit } = parseIngredientString(raw)
        ingredients.push({ name, amount, unit, category: detectCategory(name) })
      }
    })
    if (instructions.length > 0) return { title, description, image_url, instructions, ingredients }
  }

  return { title, description, image_url, instructions: [], ingredients: [] }
}

export async function crawlRecipeUrls(limit = 5): Promise<string[]> {
  const html = await fetch('https://www.10000recipe.com/recipe/list.html?type=best', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  }).then(r => r.text())

  const $ = cheerio.load(html)
  const urls = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (/^\/recipe\/\d+$/.test(href)) {
      urls.add(`https://www.10000recipe.com${href}`)
    }
  })

  return Array.from(urls).slice(0, limit)
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  }).then(r => r.text())

  const $ = cheerio.load(html)
  $('script:not([type="application/ld+json"]), style, nav, footer, header, aside').remove()

  const jsonLd = extractFromJsonLd($)
  const generic = extractGeneric($, url)
  const merged = { ...generic, ...jsonLd }

  return {
    title: merged.title ?? '',
    description: merged.description ?? '',
    instructions: merged.instructions ?? [],
    image_url: merged.image_url ?? null,
    ingredients: (merged.ingredients ?? []).filter(i => i.name.length >= 2),
  }
}
