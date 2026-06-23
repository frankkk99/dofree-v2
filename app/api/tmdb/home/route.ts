import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p';

const thaiFallbackGenres = [
  'ทั้งหมด',
  'แอ็กชัน',
  'ผจญภัย',
  'แอนิเมชัน',
  'ตลก',
  'อาชญากรรม',
  'สารคดี',
  'ดราม่า',
  'ครอบครัว',
  'แฟนตาซี',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'เพลง',
  'ลึกลับ',
  'โรแมนติก',
  'ไซไฟ',
  'ระทึกขวัญ',
  'สงคราม',
  'ตะวันตก',
];

const rowDefinitions = [
  { title: 'กำลังฉาย', subtitle: 'หนังที่กำลังฉายในโรง', path: '/movie/now_playing', mediaType: 'movie', pages: 4 },
  { title: 'กำลังจะเข้าฉาย', subtitle: 'หนังใหม่ที่กำลังจะมา', path: '/movie/upcoming', mediaType: 'movie', pages: 3 },
  { title: 'ยอดนิยมตอนนี้', subtitle: 'เรื่องที่คนดูสนใจมากที่สุด', path: '/movie/popular', mediaType: 'movie', pages: 3 },
  { title: 'กำลังมาแรง', subtitle: 'หนังที่ถูกพูดถึงในช่วงนี้', path: '/trending/movie/week', mediaType: 'movie', pages: 3 },
  { title: 'คะแนนสูง', subtitle: 'หนังที่ได้รับคะแนนดี', path: '/movie/top_rated', mediaType: 'movie', pages: 3 },
  { title: 'แอ็กชัน / ผจญภัย', subtitle: 'หนังพลังสูง เดินเรื่องไว', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '28,12', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'ครอบครัว / แอนิเมชัน', subtitle: 'ดูง่าย เหมาะกับทุกวัย', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '16,10751', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'ตลก / ดูสบาย', subtitle: 'เบาสมอง ดูเพลิน', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '35', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'ระทึกขวัญ / สยองขวัญ', subtitle: 'ลุ้น เข้มข้น และน่ากลัว', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '27,53', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'ไซไฟ / แฟนตาซี', subtitle: 'โลกอนาคต เวทมนตร์ และจินตนาการ', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '878,14', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'โรแมนติก / ดราม่า', subtitle: 'ความรัก ความสัมพันธ์ และชีวิต', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '10749,18', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'อาชญากรรม / ลึกลับ', subtitle: 'คดี ปริศนา และการสืบสวน', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '80,9648', sort_by: 'popularity.desc' }, pages: 3 },
  { title: 'สารคดี', subtitle: 'เรื่องจริงและสาระน่าติดตาม', path: '/discover/movie', mediaType: 'movie', params: { with_genres: '99', sort_by: 'popularity.desc' }, pages: 2 },
  { title: 'ซีรีส์กำลังมาแรง', subtitle: 'ซีรีส์ที่ถูกพูดถึงในช่วงนี้', path: '/trending/tv/week', mediaType: 'tv', pages: 3 },
  { title: 'ซีรีส์ยอดนิยม', subtitle: 'ซีรีส์ที่คนดูสนใจมากที่สุด', path: '/tv/popular', mediaType: 'tv', pages: 3 },
  { title: 'ซีรีส์คะแนนสูง', subtitle: 'ซีรีส์ที่ได้รับคะแนนดี', path: '/tv/top_rated', mediaType: 'tv', pages: 3 },
];

const readEnv = (...names: string[]) =>
  names.map((name) => process.env[name]?.trim()).find(Boolean);

const looksLikeReadAccessToken = (value?: string) =>
  Boolean(value && (value.startsWith('eyJ') || value.split('.').length >= 3));

function getCredential() {
  const configuredToken = readEnv(
    'TMDB_ACCESS_TOKEN',
    'TMDB_READ_ACCESS_TOKEN',
    'TMDB_BEARER_TOKEN',
    'NEXT_PUBLIC_TMDB_ACCESS_TOKEN',
  );
  const explicitApiKey = readEnv('TMDB_API_KEY', 'NEXT_PUBLIC_TMDB_API_KEY', 'VITE_TMDB_API_KEY');
  const readAccessToken = looksLikeReadAccessToken(configuredToken) ? configuredToken : undefined;
  const apiKey = explicitApiKey || (!readAccessToken ? configuredToken : undefined);
  return { readAccessToken, apiKey };
}

async function tmdb(path: string, params: Record<string, string | number> = {}) {
  const { readAccessToken, apiKey } = getCredential();

  if (!readAccessToken && !apiKey) {
    throw new Error('TMDB credential is not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  if (apiKey) url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString(), {
    headers: readAccessToken
      ? { Authorization: `Bearer ${readAccessToken}`, Accept: 'application/json' }
      : { Accept: 'application/json' },
    next: { revalidate: 1800 },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.status_message || data?.error || `TMDB request failed with ${response.status}`);
  }

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

function mergeMovie(en: any, th: any, fallbackType: 'movie' | 'tv', enGenres: Record<number, string>, thGenres: Record<number, string>) {
  const source = en || th;
  const mediaType = mediaTypeOf(source, fallbackType);
  const genres = mapGenres(en || th, enGenres);
  const thaiGenres = mapGenres(th || en, thGenres);

  return {
    id: source.id,
    mediaType,
    title: titleOf(en || source),
    thaiTitle: titleOf(th || {}) || undefined,
    year: yearOf(source),
    rating: ratingOf(source),
    genres: genres.length ? genres : [mediaType === 'tv' ? 'ซีรีส์' : 'หนัง'],
    thaiGenres: thaiGenres.length ? thaiGenres : undefined,
    overview: en?.overview || source?.overview || 'No English overview available.',
    thaiOverview: th?.overview || undefined,
    poster: image(en?.poster_path || th?.poster_path, 'w500') || image(source?.poster_path, 'w500'),
    backdrop: image(en?.backdrop_path || th?.backdrop_path, 'original') || image(source?.poster_path, 'original'),
  };
}

function uniqueMovies(items: any[]) {
  return Array.from(new Map(items.filter((item) => item?.id && item?.poster).map((item) => [`${item.mediaType}-${item.id}`, item])).values());
}

async function getGenreMaps() {
  const [movieEn, movieTh, tvEn, tvTh] = await Promise.allSettled([
    tmdb('/genre/movie/list', { language: 'en-US' }),
    tmdb('/genre/movie/list', { language: 'th-TH' }),
    tmdb('/genre/tv/list', { language: 'en-US' }),
    tmdb('/genre/tv/list', { language: 'th-TH' }),
  ]);
  const value = (result: PromiseSettledResult<any>) => (result.status === 'fulfilled' ? result.value?.genres || [] : []);
  const toMap = (items: any[]) => Object.fromEntries(items.map((genre) => [genre.id, genre.name]));
  const enList = [...value(movieEn), ...value(tvEn)];
  const thList = [...value(movieTh), ...value(tvTh)];
  const thaiOptions = thList.length ? thList.map((genre) => genre.name) : thaiFallbackGenres.slice(1);
  return {
    en: toMap(enList),
    th: toMap(thList),
    options: Array.from(new Set(['ทั้งหมด', ...thaiOptions].filter(Boolean))),
  };
}

async function fetchRow(definition: (typeof rowDefinitions)[number], genreMaps: { en: Record<number, string>; th: Record<number, string> }, defaultPages: number) {
  const pages = Math.min(Number(definition.pages || defaultPages), defaultPages);
  const pageResults = await Promise.allSettled(
    Array.from({ length: pages }, async (_, index) => {
      const page = index + 1;
      const params = { page, include_adult: 'false', ...(definition.params || {}) };
      const [en, th] = await Promise.allSettled([
        tmdb(definition.path, { language: 'en-US', ...params }),
        tmdb(definition.path, { language: 'th-TH', ...params }),
      ]);
      const enItems = en.status === 'fulfilled' ? en.value?.results || [] : [];
      const thItems = th.status === 'fulfilled' ? th.value?.results || [] : [];
      const thMap = new Map(thItems.map((item: any) => [keyOf(item, definition.mediaType as 'movie' | 'tv'), item]));
      return enItems
        .filter((item: any) => item?.poster_path)
        .map((item: any) => mergeMovie(item, thMap.get(keyOf(item, definition.mediaType as 'movie' | 'tv')), definition.mediaType as 'movie' | 'tv', genreMaps.en, genreMaps.th));
    }),
  );

  const movies = uniqueMovies(pageResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))).slice(0, 80);
  return { title: definition.title, subtitle: definition.subtitle, movies };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const defaultPages = Math.max(1, Math.min(Number(searchParams.get('pages') || 3), 5));

  try {
    const credential = getCredential();
    if (!credential.readAccessToken && !credential.apiKey) {
      return NextResponse.json({ error: 'TMDB credential is not configured', rows: [] }, { status: 500 });
    }

    const genreMaps = await getGenreMaps();
    const rowResults = await Promise.allSettled(rowDefinitions.map((definition) => fetchRow(definition, genreMaps, defaultPages)));
    const rows = rowResults.flatMap((result) => (result.status === 'fulfilled' && result.value.movies.length ? [result.value] : []));
    const allMovies = uniqueMovies(rows.flatMap((row) => row.movies));

    return NextResponse.json({
      ok: true,
      mode: credential.readAccessToken ? 'read_access_token' : 'api_key',
      rowCount: rows.length,
      movieCount: allMovies.length,
      genreOptions: genreMaps.options,
      featured: rows[3]?.movies[0] || rows[2]?.movies[0] || rows[1]?.movies[0] || allMovies[0] || null,
      rows,
    }, { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400' } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to build TMDB home feed', rows: [] }, { status: 500 });
  }
}
