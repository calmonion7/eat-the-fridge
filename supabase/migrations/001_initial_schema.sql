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
