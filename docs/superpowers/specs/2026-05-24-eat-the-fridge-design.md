# Eat the Fridge — Design Spec

**Date:** 2026-05-24  
**Status:** Approved

---

## Overview

냉장고에 있는 재료를 입력하면 만들 수 있는 레시피를 추천해주는 웹 앱.  
Next.js PWA로 웹과 모바일 모두 지원. 레시피는 관리자가 DB에 등록하고, 사용자는 재료 매칭 기반으로 검색한다.

---

## Architecture

```
[Client - Next.js App Router]
        ↓ RSC + API Routes
[Supabase]
  ├── PostgreSQL (레시피, 재료, 냉장고, 즐겨찾기)
  └── Auth (이메일/소셜 로그인)
        ↓
[Vercel] (배포)
```

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **DB + Auth:** Supabase (PostgreSQL + Supabase Auth)
- **PWA:** next-pwa (오프라인 지원, 홈 화면 설치)
- **Deploy:** Vercel

---

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | 홈 — 재료 선택 + 레시피 검색 | No |
| `/recipes` | 검색 결과 목록 | No |
| `/recipes/[id]` | 레시피 상세 | No |
| `/fridge` | 내 냉장고 관리 | Yes |
| `/favorites` | 즐겨찾기 목록 | Yes |
| `/admin` | 레시피/재료 관리 (관리자) | Admin |
| `/auth/login` | 로그인 | — |

---

## Data Model

```sql
-- 재료 (관리자가 등록)
ingredients (
  id        uuid primary key,
  name      text not null,
  category  text not null  -- 채소, 고기, 유제품, 양념, 기타
)

-- 레시피 (관리자가 등록)
recipes (
  id           uuid primary key,
  title        text not null,
  description  text,
  instructions text not null,
  image_url    text,
  created_at   timestamptz default now()
)

-- 레시피 ↔ 재료 연결
recipe_ingredients (
  recipe_id      uuid references recipes(id),
  ingredient_id  uuid references ingredients(id),
  amount         text,  -- "2", "100"
  unit           text,  -- "개", "g", "ml"
  primary key (recipe_id, ingredient_id)
)

-- 내 냉장고 (로그인 유저)
fridge_items (
  id             uuid primary key,
  user_id        uuid references auth.users(id),
  ingredient_id  uuid references ingredients(id),
  unique (user_id, ingredient_id)
)

-- 즐겨찾기
favorites (
  id         uuid primary key,
  user_id    uuid references auth.users(id),
  recipe_id  uuid references recipes(id),
  unique (user_id, recipe_id)
)
```

---

## Core Features

### 홈 (`/`)
- 재료 카테고리별 탭 (채소, 고기, 유제품, 양념, 기타)
- 탭 아래 재료 칩(chip) 목록 — 클릭으로 선택/해제
- 텍스트 검색창으로 재료 직접 입력 가능 (자동완성)
- 선택된 재료 상단에 뱃지로 표시 + 개별 제거 가능
- "냉장고에서 불러오기" 버튼 (로그인 유저)
- "레시피 찾기" 버튼 → `/recipes?ingredients=id1,id2,...`

### 검색 결과 (`/recipes`)
- 매칭 재료 수 기준 내림차순 정렬
- 카드: 이미지, 제목, "재료 N/M개 보유" 배지
- "내 재료로만 만들 수 있는 레시피" 필터 토글

### 레시피 상세 (`/recipes/[id]`)
- 레시피 이미지, 제목, 설명
- 재료 목록 — 내가 선택한 재료 하이라이트
- 조리 순서 (단계별)
- 즐겨찾기 버튼 (로그인 유저)

### 내 냉장고 (`/fridge`)
- 현재 저장된 재료 목록 (카테고리별)
- 재료 추가 (검색 + 칩 선택)
- 재료 삭제
- "이 재료로 레시피 찾기" 버튼

### 즐겨찾기 (`/favorites`)
- 저장한 레시피 카드 목록
- 즐겨찾기 해제

### 관리자 (`/admin`)
- 레시피 CRUD (제목, 설명, 조리법, 재료 연결, 이미지 업로드)
- 재료 CRUD (이름, 카테고리)
- 관리자 여부: `auth.users` 메타데이터의 `role: admin` 필드로 구분

---

## Search Logic

사용자가 선택한 재료 집합 S, 레시피 재료 집합 R일 때:
- **매칭 수:** `|S ∩ R|`
- **매칭 비율:** `|S ∩ R| / |R|`
- 정렬: 매칭 수 내림차순, 동점 시 매칭 비율 내림차순
- "내 재료로만 가능" 필터: `|R - S| = 0` 인 레시피만 표시

---

## PWA Config

- `manifest.json`: 앱 이름, 아이콘, 테마 색상
- Service Worker: 정적 자산 캐시 (next-pwa 기본 설정)
- 모바일 홈 화면 추가 지원
