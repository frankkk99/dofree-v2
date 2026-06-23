-- DOFree v2 admin CMS schema
-- Allows an admin user to control site text, sections, categories, and movie links.

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create table if not exists public.site_settings (
  key text primary key,
  label text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sections (
  key text primary key,
  title_th text not null,
  description text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_th text not null,
  subtitle_th text,
  tmdb_path text not null,
  media_type text not null default 'movie' check (media_type in ('movie', 'tv')),
  tmdb_params jsonb not null default '{}'::jsonb,
  pages integer not null default 3,
  enabled boolean not null default true,
  autoplay boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_movie_links (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text,
  title_th text,
  watch_url text,
  trailer_url text,
  provider text,
  is_active boolean not null default true,
  notes text,
  updated_at timestamptz not null default now(),
  unique (tmdb_id, media_type)
);

alter table public.site_settings enable row level security;
alter table public.admin_sections enable row level security;
alter table public.admin_categories enable row level security;
alter table public.admin_movie_links enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read enabled sections" on public.admin_sections;
create policy "Public can read enabled sections" on public.admin_sections
  for select using (enabled = true or public.is_admin(auth.uid()));

drop policy if exists "Admins manage sections" on public.admin_sections;
create policy "Admins manage sections" on public.admin_sections
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read enabled categories" on public.admin_categories;
create policy "Public can read enabled categories" on public.admin_categories
  for select using (enabled = true or public.is_admin(auth.uid()));

drop policy if exists "Admins manage categories" on public.admin_categories;
create policy "Admins manage categories" on public.admin_categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read active movie links" on public.admin_movie_links;
create policy "Public can read active movie links" on public.admin_movie_links
  for select using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins manage movie links" on public.admin_movie_links;
create policy "Admins manage movie links" on public.admin_movie_links
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.site_settings (key, label, value) values
  ('brand', 'แบรนด์หน้าเว็บ', '{"siteName":"DOFree By Frank","tagline":"รวมหนังและซีรีส์ พร้อมข้อมูลไทย / อังกฤษ"}'::jsonb),
  ('hero', 'ข้อความ Hero', '{"primaryButton":"รับชมตัวอย่าง","secondaryButton":"ข้อมูลเพิ่มเติม","loadingText":"กำลังโหลดข้อมูลหนังล่าสุด...","fallbackText":"กำลังแสดงชุดตัวอย่าง • ข้อมูลหนังจริงกำลังอัปเดต"}'::jsonb),
  ('navigation', 'เมนูหลัก', '{"movies":"หนัง","categories":"หมวดหมู่","portfolio":"ผลงาน"}'::jsonb),
  ('premium', 'ข้อความ Premium', '{"title":"Premium","body":"ปลดล็อกประสบการณ์รับชมที่ครบขึ้น พร้อมรายการโปรดและประวัติการรับชมในบัญชีของคุณ"}'::jsonb)
on conflict (key) do nothing;

insert into public.admin_sections (key, title_th, description, enabled, sort_order, settings) values
  ('hero', 'Hero ด้านบน', 'เปิด/ปิดส่วนแนะนำหนังหลัก', true, 10, '{}'::jsonb),
  ('now_playing', 'กำลังฉาย', 'แถวเลื่อนอัตโนมัติสำหรับหนังที่กำลังฉาย', true, 20, '{"autoplay":true}'::jsonb),
  ('categories', 'หมวดหมู่', 'แถบค้นหาและหมวดหมู่', true, 30, '{}'::jsonb),
  ('movie_rows', 'รายการหนังทั้งหมด', 'แถวหนังและซีรีส์บนหน้าแรก', true, 40, '{}'::jsonb)
on conflict (key) do nothing;

insert into public.admin_categories (slug, title_th, subtitle_th, tmdb_path, media_type, tmdb_params, pages, enabled, autoplay, sort_order) values
  ('now-playing', 'กำลังฉาย', 'หนังที่กำลังฉายในโรง', '/movie/now_playing', 'movie', '{}'::jsonb, 4, true, true, 10),
  ('upcoming', 'เร็ว ๆ นี้', 'หนังใหม่ที่กำลังจะมา', '/movie/upcoming', 'movie', '{}'::jsonb, 3, true, false, 20),
  ('popular', 'ยอดนิยมตอนนี้', 'เรื่องที่คนดูสนใจมากที่สุด', '/movie/popular', 'movie', '{}'::jsonb, 3, true, false, 30),
  ('trending', 'กำลังมาแรง', 'หนังที่ถูกพูดถึงในช่วงนี้', '/trending/movie/week', 'movie', '{}'::jsonb, 3, true, false, 40),
  ('top-rated', 'คะแนนสูง', 'หนังที่ได้คะแนนดี', '/movie/top_rated', 'movie', '{}'::jsonb, 3, true, false, 50),
  ('action', 'แอ็กชัน / ผจญภัย', 'หนังมันส์ ดูสนุก', '/discover/movie', 'movie', '{"with_genres":"28,12","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 60),
  ('family-animation', 'ครอบครัว / แอนิเมชัน', 'ดูง่ายสำหรับทุกคน', '/discover/movie', 'movie', '{"with_genres":"16,10751","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 70),
  ('comedy', 'ตลก / ดูสบาย', 'หนังเบาสมอง', '/discover/movie', 'movie', '{"with_genres":"35","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 80),
  ('horror-thriller', 'สยองขวัญ / ระทึกขวัญ', 'ลุ้นและตื่นเต้น', '/discover/movie', 'movie', '{"with_genres":"27,53","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 90),
  ('scifi-fantasy', 'ไซไฟ / แฟนตาซี', 'โลกใหม่ จินตนาการสูง', '/discover/movie', 'movie', '{"with_genres":"878,14","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 100),
  ('romance-drama', 'โรแมนติก / ดราม่า', 'เรื่องรักและชีวิต', '/discover/movie', 'movie', '{"with_genres":"10749,18","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 110),
  ('crime-mystery', 'อาชญากรรม / ลึกลับ', 'สืบสวนและปริศนา', '/discover/movie', 'movie', '{"with_genres":"80,9648","sort_by":"popularity.desc"}'::jsonb, 3, true, false, 120),
  ('documentary', 'สารคดี', 'เรื่องจริงและความรู้', '/discover/movie', 'movie', '{"with_genres":"99","sort_by":"popularity.desc"}'::jsonb, 2, true, false, 130),
  ('trending-tv', 'ซีรีส์กำลังมาแรง', 'ซีรีส์ที่ถูกพูดถึง', '/trending/tv/week', 'tv', '{}'::jsonb, 3, true, false, 140),
  ('popular-tv', 'ซีรีส์ยอดนิยม', 'ซีรีส์ที่คนดูเยอะ', '/tv/popular', 'tv', '{}'::jsonb, 3, true, false, 150),
  ('top-rated-tv', 'ซีรีส์คะแนนสูง', 'ซีรีส์ที่ได้คะแนนดี', '/tv/top_rated', 'tv', '{}'::jsonb, 3, true, false, 160)
on conflict (slug) do nothing;

create index if not exists admin_categories_sort_idx on public.admin_categories(sort_order, enabled);
create index if not exists admin_movie_links_tmdb_idx on public.admin_movie_links(tmdb_id, media_type, is_active);
