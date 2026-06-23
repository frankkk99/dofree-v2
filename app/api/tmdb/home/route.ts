import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p';

type CategoryDefinition = {
  slug?: string;
  title: string;
  subtitle: string;
  path: string;
  mediaType: 'movie' | 'tv';
  params?: Record<string, string>;
  pages: number;
  autoplay?: boolean;
  sortOrder?: number;
};

type MovieLink = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title?: string | null;
  title_th?: string | null;
  watch_url?: string | null;
  trailer_url?: string | null;
  provider?: string | null;
};

const thaiFallbackGenres = ['ทั้งหมด', 'แอ็กชัน', 'ผจญภัย', 'แอนิเมชัน', 'ตลก', 'อาชญากรรม', 'สารคดี', 'ดราม่า', 'ครอบครัว', 'แฟนตาซี', 'ประวัติศาสตร์', 'สยองขวัญ', 'เพลง', 'ลึกลับ', 'โรแมนติก', 'ไซไฟ', 'ระทึกขวัญ', 'สงคราม', 'ตะวันตก'];

const defaultRowDefinitions: CategoryDefinition[] = [
  { slug: 'now-playing', title: 'กำลังฉาย', subtitle: 'หนังที่กำลังฉายในโรง', path: '/movie/now_playing', mediaType: 'movie', pages: 4, autoplay: true, sortOrder: 10 },
  { slug: 'upcoming', title: 'กำลังจะเข้าฉาย', subtitle: 'หนังใหม่ที่กำลังจะมา', path: '/movie/upcoming', mediaType: 'movie', pages: 3, sortOrder: 20 },
  { slug: 'popular', title: 'ยอดนิยมตอนนี้', subtitle: 'เรื่องที่คนดูสนใจมากที่สุด', path: '/movie/popular', mediaType: 'movie', pages: 3, sortOrder: 30 },
  { slug: 'western-movies', title: 'หนังฝรั่ง', subtitle: 'หนังต่างประเทศยอดนิยม', path: '/discover/movie', mediaType: 'movie', params: { with_original_language: 'en', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 35 },
  { slug: 'thai-movies', title: 'หนังไทย', subtitle: 'หนังไทยยอดนิยม', path: '/discover/movie', mediaType: 'movie', params: { with_original_language: 'th', region: 'TH', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 36 },
  { slug: 'trending', title: 'กำลังมาแรง', subtitle: 'หนังที่ถูกพูดถึงในช่วงนี้', path: '/trending/movie/week', mediaType: 'movie', pages: 3, sortOrder: 40 },
  { slug: 'top-rated', title: 'คะแนนสูง', subtitle: 'หนังที่ได้รับคะแนนดี', path: '/movie/top_rated', mediaType: 'movie', pages: 3, sortOrder: 50 },
  { slug: 'action', title: 'แอ็กชัน / ผจญภัย', subtitle: 'หนังพลังสูง เดินเรื่องไว', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '28,12', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 60 },
  { slug: 'family-animation', title: 'ครอบครัว / แอนิเมชัน', subtitle: 'ดูง่าย เหมาะกับทุกวัย', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '16,10751', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 70 },
  { slug: 'comedy', title: 'ตลก / ดูสบาย', subtitle: 'เบาสมอง ดูเพลิน', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '35', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 80 },
  { slug: 'horror-thriller', title: 'ระทึกขวัญ / สยองขวัญ', subtitle: 'ลุ้น เข้มข้น และน่ากลัว', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '27,53', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 90 },
  { slug: 'scifi-fantasy', title: 'ไซไฟ / แฟนตาซี', subtitle: 'โลกอนาคต เวทมนตร์ และจินตนาการ', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '878,14', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 100 },
  { slug: 'romance-drama', title: 'โรแมนติก / ดราม่า', subtitle: 'ความรัก ความสัมพันธ์ และชีวิต', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '10749,18', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 110 },
  { slug: 'crime-mystery', title: 'อาชญากรรม / ลึกลับ', subtitle: 'คดี ปริศนา และการสืบสวน', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '80,9648', sort_by: 'popularity.desc' }, pages: 3, sortOrder: 120 },
  { slug: 'documentary', title: 'สารคดี', subtitle: 'เรื่องจริงและสาระน่าติดตาม', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '99', sort_by: 'popularity.desc' }, pages: 2, sortOrder: 130 },
  { slug: 'trending-tv', title: 'ซีรีส์กำลังมาแรง', subtitle: 'ซีรีส์ที่ถูกพูดถึงในช่วงนี้', path: '/trending/tv/week', mediaType: 'tv', pages: 3, sortOrder: 140 },
  { slug: 'popular-tv', title: 'ซีรีส์ยอดนิยม', subtitle: 'ซีรีส์ที่คนดูสนใจมากที่สุด', path: '/tv/popular', mediaType: 'tv', pages: 3, sortOrder: 150 },
  { slug: 'top-rated-tv', title: 'ซีรีส์คะแนนสูง', subtitle: 'ซีรีส์ที่ได้รับคะแนนดี', path: '/tv/top_rated', mediaType: 'tv', pages: 3, sortOrder: 160 },
];

const readEnv = (...names: string[]) => names.map((name) => process.env[name]?.trim()).find(Boolean);
const looksLikeReadAccessToken = (value?: string) => Boolean(value && (value.startsWith('eyJ') || value.split('.').length >= 3));

function getCredential() {
  const configuredToken = readEnv('TMDB_ACCESS_TOKEN', 'TMDB_READ_ACCESS_TOKEN', 'TMDB_BEARER_TOKEN', 'NEXT_PUBLIC_TMDB_ACCESS_TOKEN');
  const explicitApiKey = readEnv('TMDB_API_KEY', 'NEXT_PUBLIC_TMDB_API_KEY', 'VITE_TMDB_API_KEY');
  const readAccessToken = looksLikeReadAccessToken(configuredToken) ? configuredToken : undefined;
  const apiKey = explicitApiKey || (!readAccessToken ? configuredToken : undefined);
  return { readAccessToken, apiKey };
}

async function tmdb(path: string, params: Record<string, string | number> = {}) {
  const { readAccessToken, apiKey } = getCredential();
  if (!readAccessToken && !apiKey) throw new Error('TMDB credential is not configured');

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  if (apiKey) url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString(), {
    headers: readAccessToken ? { Authorization: `Bearer ${readAccessToken}`, Accept: 'application/json' } : { Accept: 'application/json' },
    next: { revalidate: 1800 },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.status_message || data?.error || `TMDB request failed with ${response.status}`);
  return data;
}

function mediaTypeOf(item: any, fallback: 'movie' | 'tv' = 'movie') {
  if (item?.media_type === 'tv' || item?.first_air_date || item?.name) return 'tv';
  if (item?.media_type === 'movie' || item?.release_date || item?.title) return 'movie';
  return fallback;
}

function yearOf(item: any) {
  return (item?.release_date || item?.first_air_date || '').slice(0, 4) || 'N/A';
}

function ratingOf(item: any) {
  return typeof item?.vote_average === 'number' ? item.vote_average.toFixed(1) : '0.0';
}

function image(path?: string | null, size = 'w500') {
  return path ? `${imageBase}/${size}${path}` : undefined;
}

function titleOf(item: any) {
  return item?.title || item?.name || item?.original_title || item?.original_name || 'Untitled';
}

function mapGenres(item: any, genreMap: Record<number, string>) {
  const ids = item?.genre_ids || item?.genres?.map((genre: any) => genre.id) || [];
  return ids.map((id: number) => genreMap[id]).filter(Boolean);
}

function keyOf(item: any, fallbackType: 'movie' | 'tv') {
  return `${mediaTypeOf(item, fallbackType)}-${item?.id}`;
}

function mergeMovie(en: any, th: any, fallbackType: 'movie' | 'tv', enGenres: Record<number, string>, thGenres: Record<number, string>, linkMap: Map<string, MovieLink>) {
  const source = en || th;
  const mediaType = mediaTypeOf(source, fallbackType);
  const link = linkMap.get(`${mediaType}-${source.id}`);
  const genres = mapGenres(en || th, enGenres);
  const thaiGenres = mapGenres(th || en, thGenres);
  return {
    id: source.id,
    mediaType,
    title: link?.title || titleOf(en || source),
    thaiTitle: link?.title_th || titleOf(th || {}) || undefined,
    year: yearOf(source),
    rating: ratingOf(source),
    genres: genres.length ? genres : [mediaType === 'tv' ? 'ซีรีส์' : 'หนัง'],
    thaiGenres: thaiGenres.length ? thaiGenres : undefined,
    overview: en?.overview || source?.overview || 'No English overview available.',
    thaiOverview: th?.overview || undefined,
    poster: image(en?.poster_path || th?.poster_path, 'w500') || image(source?.poster_path, 'w500'),
    backdrop: image(en?.backdrop_path || th?.backdrop_path, 'original') || image(source?.poster_path, 'original'),
    watchUrl: link?.watch_url || undefined,
    trailerUrl: link?.trailer_url || undefined,
    provider: link?.provider || undefined,
  };
}

function uniqueMovies(items: any[]) {
  return Array.from(new Map(items.filter((item) => item?.id && item?.poster).map((item) => [`${item.mediaType}-${item.id}`, item])).values());
}

async function getAdminCategories(): Promise<CategoryDefinition[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return defaultRowDefinitions;
  const { data, error } = await supabase.from('admin_categories').select('slug,title_th,subtitle_th,tmdb_path,media_type,tmdb_params,pages,enabled,autoplay,sort_order').eq('enabled', true).order('sort_order', { ascending: true });
  if (error || !data?.length) return defaultRowDefinitions;
  return data.map((item: any) => ({ slug: item.slug, title: item.title_th, subtitle: item.subtitle_th || '', path: item.tmdb_path, mediaType: item.media_type, params: item.tmdb_params || {}, pages: item.pages || 3, autoplay: item.autoplay, sortOrder: item.sort_order }));
}

async function getMovieLinks() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return new Map<string, MovieLink>();
  const { data } = await supabase.from('admin_movie_links').select('tmdb_id,media_type,title,title_th,watch_url,trailer_url,provider').eq('is_active', true);
  return new Map((data || []).map((item: any) => [`${item.media_type}-${item.tmdb_id}`, item as MovieLink]));
}

async function getGenreMaps() {
  const [movieEn, movieTh, tvEn, tvTh] = await Promise.allSettled([tmdb('/genre/movie/list', { language: 'en-US' }), tmdb('/genre/movie/list', { language: 'th-TH' }), tmdb('/genre/tv/list', { language: 'en-US' }), tmdb('/genre/tv/list', { language: 'th-TH' })]);
  const value = (result: PromiseSettledResult<any>) => (result.status === 'fulfilled' ? result.value?.genres || [] : []);
  const toMap = (items: any[]) => Object.fromEntries(items.map((genre) => [genre.id, genre.name]));
  const enList = [...value(movieEn), ...value(tvEn)];
  const thList = [...value(movieTh), ...value(tvTh)];
  const thaiOptions = thList.length ? thList.map((genre) => genre.name) : thaiFallbackGenres.slice(1);
  return { en: toMap(enList), th: toMap(thList), options: Array.from(new Set(['ทั้งหมด', ...thaiOptions].filter(Boolean))) };
}

async function fetchRow(definition: CategoryDefinition, genreMaps: { en: Record<number, string>; th: Record<number, string> }, defaultPages: number, linkMap: Map<string, MovieLink>) {
  const pages = Math.min(Number(definition.pages || defaultPages), defaultPages);
  let totalPages = pages;
  const pageResults = await Promise.allSettled(Array.from({ length: pages }, async (_, index) => {
    const page = index + 1;
    const params = { page, include_adult: 'false', ...(definition.params || {}) };
    const [en, th] = await Promise.allSettled([tmdb(definition.path, { language: 'en-US', ...params }), tmdb(definition.path, { language: 'th-TH', ...params })]);
    const enValue = en.status === 'fulfilled' ? en.value : null;
    const thValue = th.status === 'fulfilled' ? th.value : null;
    totalPages = Math.max(totalPages, Math.min(Number(enValue?.total_pages || thValue?.total_pages || pages), 500));
    const enItems = enValue?.results || [];
    const thItems = thValue?.results || [];
    const thMap = new Map(thItems.map((item: any) => [keyOf(item, definition.mediaType), item]));
    return enItems.filter((item: any) => item?.poster_path).map((item: any) => mergeMovie(item, thMap.get(keyOf(item, definition.mediaType)), definition.mediaType, genreMaps.en, genreMaps.th, linkMap));
  }));
  const movies = uniqueMovies(pageResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))).slice(0, 80);
  return { title: definition.title, subtitle: definition.subtitle, movies, slug: definition.slug, autoplay: Boolean(definition.autoplay), loadedPages: pages, hasMore: pages < totalPages };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const defaultPages = Math.max(1, Math.min(Number(searchParams.get('pages') || 3), 5));
  try {
    const credential = getCredential();
    if (!credential.readAccessToken && !credential.apiKey) return NextResponse.json({ error: 'TMDB credential is not configured', rows: [] }, { status: 500 });
    const [genreMaps, definitions, linkMap] = await Promise.all([getGenreMaps(), getAdminCategories(), getMovieLinks()]);
    const rowResults = await Promise.allSettled(definitions.map((definition) => fetchRow(definition, genreMaps, defaultPages, linkMap)));
    const rows = rowResults.flatMap((result) => (result.status === 'fulfilled' && result.value.movies.length ? [result.value] : []));
    const allMovies = uniqueMovies(rows.flatMap((row) => row.movies));
    return NextResponse.json({ ok: true, mode: credential.readAccessToken ? 'read_access_token' : 'api_key', rowCount: rows.length, movieCount: allMovies.length, genreOptions: genreMaps.options, featured: rows[3]?.movies[0] || rows[2]?.movies[0] || rows[1]?.movies[0] || allMovies[0] || null, rows }, { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400' } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to build movie home feed', rows: [] }, { status: 500 });
  }
}
