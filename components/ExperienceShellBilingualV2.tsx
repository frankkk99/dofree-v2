'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CastMember, MediaType, Movie, MovieRowData } from '@/types/movie';
import { featuredMovie as fallbackFeatured, movieRows as fallbackRows, movies as fallbackMovies } from '@/lib/movies';
import { genres as fallbackGenres } from '@/lib/genres';

const imageBase = 'https://image.tmdb.org/t/p';
const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
const fallbackBackdrop = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop';
const storagePrefix = 'dofree:v2';

const rowDefinitions = [
  { title: 'กำลังจะเข้าฉาย', subtitle: 'Upcoming / เร็ว ๆ นี้', path: '/movie/upcoming', pages: 5 },
  { title: 'ยอดนิยมตอนนี้', subtitle: 'Popular / ยอดนิยม', path: '/movie/popular', pages: 5 },
  { title: 'กำลังมาแรง', subtitle: 'Trending / กำลังมาแรง', path: '/trending/movie/week', pages: 5 },
  { title: 'คะแนนสูง', subtitle: 'Top Rated / คะแนนสูง', path: '/movie/top_rated', pages: 5 },
  { title: 'แอ็กชัน / ผจญภัย', subtitle: 'Action / Adventure', path: '/discover/movie', params: { with_genres: '28,12', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'ครอบครัว / แอนิเมชัน', subtitle: 'Family / Animation', path: '/discover/movie', params: { with_genres: '16,10751', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'ตลก / Feel Good', subtitle: 'Comedy / Easy watching', path: '/discover/movie', params: { with_genres: '35', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'ระทึกขวัญ / สยองขวัญ', subtitle: 'Thriller / Horror', path: '/discover/movie', params: { with_genres: '27,53', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'ไซไฟ / แฟนตาซี', subtitle: 'Sci-Fi / Fantasy', path: '/discover/movie', params: { with_genres: '878,14', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'โรแมนติก / ดราม่า', subtitle: 'Romance / Drama', path: '/discover/movie', params: { with_genres: '10749,18', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'อาชญากรรม / ลึกลับ', subtitle: 'Crime / Mystery', path: '/discover/movie', params: { with_genres: '80,9648', sort_by: 'popularity.desc' }, pages: 5 },
  { title: 'ซีรีส์กำลังมาแรง', subtitle: 'Trending TV / ซีรีส์มาแรง', path: '/trending/tv/week', pages: 4 },
  { title: 'ซีรีส์ยอดนิยม', subtitle: 'Popular TV / ซีรีส์ยอดนิยม', path: '/tv/popular', pages: 4 },
];

const baseGenres = ['All', 'Trending', 'Popular', 'Top Rated', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', ...fallbackGenres];
const keyOf = (movie: Movie) => `${movie.mediaType}-${movie.id}`;
const uniqueStrings = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
const uniqueMovies = (items: Movie[]) => Array.from(new Map(items.map((movie) => [keyOf(movie), movie])).values());

async function tmdb<T>(path: string, params: Record<string, string | number> = {}) {
  const search = new URLSearchParams({ path });
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const response = await fetch(`/api/tmdb?${search.toString()}`);
  if (!response.ok) throw new Error(`TMDB request failed: ${path}`);
  return (await response.json()) as T;
}

function img(path?: string | null, size = 'w500') {
  return path ? `${imageBase}/${size}${path}` : undefined;
}

function mediaTypeOf(item: any): MediaType {
  return item?.media_type === 'tv' || item?.first_air_date || item?.name ? 'tv' : 'movie';
}

function yearOf(item: any) {
  return (item?.release_date || item?.first_air_date || '').slice(0, 4) || 'N/A';
}

function ratingOf(item: any) {
  return typeof item?.vote_average === 'number' ? item.vote_average.toFixed(1) : '0.0';
}

function titleEn(item: any) {
  return item?.title || item?.name || item?.original_title || item?.original_name || 'Untitled';
}

function titleTh(item: any) {
  return item?.title || item?.name || undefined;
}

function genresFrom(item: any, map: Record<number, string>) {
  const ids = item?.genre_ids || item?.genres?.map((genre: any) => genre.id) || [];
  return ids.map((id: number) => map[id]).filter(Boolean);
}

function mergeMovie(en: any, th: any, enGenreMap: Record<number, string>, thGenreMap: Record<number, string>): Movie {
  const source = en || th || {};
  const mediaType = mediaTypeOf(source);
  const englishTitle = titleEn(source);
  const thaiTitle = titleTh(th);
  const enGenres = genresFrom(en, enGenreMap);
  const thGenres = genresFrom(th || en, thGenreMap);

  return {
    id: source.id,
    mediaType,
    title: englishTitle,
    thaiTitle: thaiTitle || undefined,
    year: yearOf(source),
    rating: ratingOf(source),
    genres: enGenres.length ? enGenres : [mediaType === 'tv' ? 'TV Series' : 'Movie'],
    thaiGenres: thGenres.length ? thGenres : undefined,
    overview: en?.overview || 'No English overview available.',
    thaiOverview: th?.overview || undefined,
    poster: img(en?.poster_path || th?.poster_path, 'w500') || fallbackPoster,
    backdrop: img(en?.backdrop_path || th?.backdrop_path, 'original') || img(en?.poster_path || th?.poster_path, 'original') || fallbackBackdrop,
  };
}

async function getGenreMaps() {
  const [movieEn, movieTh, tvEn, tvTh] = await Promise.all([
    tmdb<{ genres?: { id: number; name: string }[] }>('/genre/movie/list', { language: 'en-US' }),
    tmdb<{ genres?: { id: number; name: string }[] }>('/genre/movie/list', { language: 'th-TH' }).catch(() => ({ genres: [] })),
    tmdb<{ genres?: { id: number; name: string }[] }>('/genre/tv/list', { language: 'en-US' }).catch(() => ({ genres: [] })),
    tmdb<{ genres?: { id: number; name: string }[] }>('/genre/tv/list', { language: 'th-TH' }).catch(() => ({ genres: [] })),
  ]);
  const toMap = (items?: { id: number; name: string }[]) => Object.fromEntries((items || []).map((genre) => [genre.id, genre.name]));
  return {
    en: { ...toMap(movieEn.genres), ...toMap(tvEn.genres) },
    th: { ...toMap(movieTh.genres), ...toMap(tvTh.genres) },
    options: uniqueStrings(['All', 'Trending', 'Popular', 'Top Rated', ...(movieEn.genres || []).map((genre) => genre.name), ...(tvEn.genres || []).map((genre) => genre.name), ...baseGenres]),
  };
}

async function fetchBilingualPages(path: string, enGenreMap: Record<number, string>, thGenreMap: Record<number, string>, params: Record<string, string | number> = {}, pages = 3) {
  const settled = await Promise.allSettled(
    Array.from({ length: pages }, async (_, index) => {
      const page = index + 1;
      const [en, th] = await Promise.all([
        tmdb<{ results?: any[] }>(path, { language: 'en-US', page, ...params }),
        tmdb<{ results?: any[] }>(path, { language: 'th-TH', page, ...params }).catch(() => ({ results: [] })),
      ]);
      const thMap = new Map((th.results || []).map((item) => [`${mediaTypeOf(item)}-${item.id}`, item]));
      return (en.results || [])
        .filter((item) => item?.poster_path)
        .map((item) => mergeMovie(item, thMap.get(`${mediaTypeOf(item)}-${item.id}`), enGenreMap, thGenreMap));
    }),
  );
  return uniqueMovies(settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))).slice(0, 100);
}

async function searchBilingual(query: string, enGenreMap: Record<number, string>, thGenreMap: Record<number, string>) {
  const [en, th] = await Promise.all([
    tmdb<{ results?: any[] }>('/search/multi', { language: 'en-US', query, include_adult: 'false', page: 1 }),
    tmdb<{ results?: any[] }>('/search/multi', { language: 'th-TH', query, include_adult: 'false', page: 1 }).catch(() => ({ results: [] })),
  ]);
  const grouped = new Map<string, { en?: any; th?: any }>();
  [...(en.results || []), ...(th.results || [])]
    .filter((item) => ['movie', 'tv'].includes(mediaTypeOf(item)) && item.poster_path)
    .forEach((item) => {
      const key = `${mediaTypeOf(item)}-${item.id}`;
      const current = grouped.get(key) || {};
      if (item.overview && /[ก-๙]/.test(`${item.overview}${item.title || item.name || ''}`)) current.th = item;
      else current.en = item;
      grouped.set(key, current);
    });
  return uniqueMovies(Array.from(grouped.values()).map(({ en, th }) => mergeMovie(en || th, th, enGenreMap, thGenreMap))).slice(0, 40);
}

async function fetchVideo(mediaType: MediaType, id: number) {
  for (const language of ['th-TH', 'en-US']) {
    const data = await tmdb<{ results?: any[] }>(`/${mediaType}/${id}/videos`, { language });
    const video =
      (data.results || []).find((item) => item.site === 'YouTube' && item.type === 'Trailer' && item.official) ||
      (data.results || []).find((item) => item.site === 'YouTube' && ['Trailer', 'Teaser'].includes(item.type)) ||
      (data.results || []).find((item) => item.site === 'YouTube');
    if (video?.key) return video.key as string;
  }
  return undefined;
}

async function fetchDetails(movie: Movie, enGenreMap: Record<number, string>, thGenreMap: Record<number, string>) {
  const [en, th, credits, trailerKey] = await Promise.all([
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'en-US' }),
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'th-TH' }).catch(() => null),
    tmdb<{ cast?: any[] }>(`/${movie.mediaType}/${movie.id}/credits`, { language: 'en-US' }).catch(() => ({ cast: [] })),
    fetchVideo(movie.mediaType, movie.id).catch(() => undefined),
  ]);
  const merged = mergeMovie(en, th, enGenreMap, thGenreMap);
  const cast: CastMember[] = (credits.cast || []).slice(0, 24).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character,
    profile: img(person.profile_path, 'w185'),
  }));

  return {
    ...movie,
    ...merged,
    runtime: en.runtime ? `${en.runtime} นาที` : en.episode_run_time?.[0] ? `${en.episode_run_time[0]} นาที` : movie.runtime,
    cast: cast.length ? cast : movie.cast,
    trailerKey,
  } satisfies Movie;
}

function Header({ userName, favoriteCount, onLogin, onPremium, onLogout, onNotify }: { userName: string | null; favoriteCount: number; onLogin: () => void; onPremium: () => void; onLogout: () => void; onNotify: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 md:h-20 md:px-8">
        <div>
          <p className="text-lg font-black tracking-tight text-red-500 md:text-2xl">DOFree By Frank</p>
          <p className="hidden text-xs text-white/40 sm:block">Movie discovery bilingual portfolio</p>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/60 md:flex">
          <a href="#movies" className="hover:text-white">Movies</a>
          <a href="#categories" className="hover:text-white">Categories</a>
          <a href="#portfolio" className="hover:text-white">Portfolio</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onNotify} className="hidden h-10 w-10 rounded-full border border-white/10 bg-white/10 sm:inline-flex sm:items-center sm:justify-center">🔔</button>
          <span className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-bold text-white/60 sm:inline-flex">♥ {favoriteCount}</span>
          <button onClick={onPremium} className="rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-300 hover:text-black">Premium</button>
          {userName ? (
            <button onClick={onLogout} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black text-white">{userName}</button>
          ) : (
            <button onClick={onLogin} className="rounded-full border border-red-400/25 bg-red-600/15 px-3 py-2 text-[11px] font-black text-white hover:bg-red-600">เข้าสู่ระบบ</button>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ movie, onInfo, onPlay }: { movie: Movie; onInfo: (movie: Movie) => void; onPlay: (movie: Movie) => void }) {
  return (
    <section className="relative min-h-[720px] overflow-hidden pt-20 md:min-h-[820px]">
      <img src={movie.backdrop} alt={movie.title} className="absolute inset-0 h-full w-full scale-105 object-cover opacity-75" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.32)_72%,rgba(0,0,0,0.80)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/85 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-7xl items-center px-4 md:min-h-[680px] md:px-8">
        <div className="max-w-2xl pt-12 md:pt-20">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-2xl">TH / EN Bilingual</div>
          <h1 className="max-w-xl text-5xl font-black leading-none tracking-tight text-white md:text-7xl">{movie.title}</h1>
          <p className="mt-3 text-lg font-bold text-red-100/80">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 md:text-base">{movie.overview}</p>
          {movie.thaiOverview ? <p className="mt-3 max-w-xl text-sm leading-7 text-white/58 md:text-base">{movie.thaiOverview}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-white/65">
            <span className="text-yellow-300">★ {movie.rating}</span><span>{movie.year}</span><span>{movie.genres.join(' / ')}</span>
            {movie.thaiGenres?.length ? <span className="text-white/40">{movie.thaiGenres.join(' / ')}</span> : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onPlay(movie)} className="rounded-xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-white/85">▶ รับชมตัวอย่าง</button>
            <button onClick={() => onInfo(movie)} className="rounded-xl border border-white/15 bg-white/15 px-6 py-3 text-sm font-black text-white hover:bg-white/25">ⓘ ข้อมูลเพิ่มเติม</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryRail({ query, activeGenre, genreOptions, onQuery, onGenre }: { query: string; activeGenre: string; genreOptions: string[]; onQuery: (value: string) => void; onGenre: (value: string) => void }) {
  const doubledGenres = useMemo(() => [...genreOptions, ...genreOptions], [genreOptions]);
  return (
    <section id="categories" className="category-dock relative z-30 mx-auto -mt-28 max-w-7xl px-3 md:-mt-24 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-2 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <label className="flex min-w-[145px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/60 md:min-w-[260px]">
            <span>⌕</span>
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="ค้นหาไทย / English" className="w-full bg-transparent font-semibold text-white outline-none placeholder:text-white/45" />
          </label>
          <div className="relative min-w-0 flex-[2] overflow-hidden rounded-xl bg-white/[0.04] py-2">
            <div className="animate-category-loop flex w-max gap-2 px-2 hover:[animation-play-state:paused]">
              {doubledGenres.map((genre, index) => (
                <button key={`${genre}-${index}`} onClick={() => onGenre(genre)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${activeGenre === genre ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{genre}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BilingualTitle({ movie, compact = false }: { movie: Movie; compact?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black text-white/45">EN</span>
        <h3 className={`${compact ? 'text-[11px]' : 'text-xs md:text-sm'} line-clamp-1 font-black text-white`}>{movie.title}</h3>
      </div>
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[8px] font-black text-red-100/70">TH</span>
        <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} line-clamp-1 font-semibold text-red-100/65`}>{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p>
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelect, onFavorite, isFavorite }: { movie: Movie; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; isFavorite: boolean }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group w-[132px] shrink-0 text-left transition duration-300 hover:-translate-y-1 md:w-[182px] lg:w-[194px]">
      <div className="relative overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10 transition group-hover:ring-red-500/50">
        <img src={movie.poster} alt={movie.title} className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-yellow-300">★ {movie.rating}</div>
        <span onClick={(event) => { event.stopPropagation(); onFavorite(movie); }} className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs ${isFavorite ? 'bg-red-600 text-white' : 'bg-black/65 text-white/70'}`}>♥</span>
      </div>
      <div className="pt-2">
        <BilingualTitle movie={movie} />
        <p className="mt-1 line-clamp-1 text-[11px] text-white/40">{movie.year} • {movie.genres[0]}{movie.thaiGenres?.[0] ? ` • ${movie.thaiGenres[0]}` : ''}</p>
      </div>
    </button>
  );
}

function MovieRow({ row, onSelect, onFavorite, favorites, onShowAll }: { row: MovieRowData; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; favorites: string[]; onShowAll: (row: MovieRowData) => void }) {
  if (!row.movies.length) return null;
  return (
    <section id="movies" className="movie-row mx-auto max-w-7xl px-3 py-5 md:px-8 md:py-7">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div><h2 className="text-lg font-black text-white md:text-2xl">{row.title}</h2><p className="mt-1 hidden text-sm text-white/45 sm:block">{row.subtitle}</p></div>
        <button onClick={() => onShowAll(row)} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/55 hover:bg-white/20 hover:text-white">ทั้งหมด</button>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-5 md:gap-4">{row.movies.map((movie) => <MovieCard key={`${row.title}-${keyOf(movie)}`} movie={movie} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(movie))} />)}</div>
    </section>
  );
}

function CategoryModal({ row, favorites, onClose, onSelect, onFavorite }: { row: MovieRowData | null; favorites: string[]; onClose: () => void; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void }) {
  if (!row) return null;
  return (
    <div className="fixed inset-0 z-[78] bg-black/90 p-3 backdrop-blur-md md:p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-7">
          <div><p className="text-[11px] font-black uppercase tracking-[0.32em] text-red-400">Browse all / ดูทั้งหมด</p><h2 className="mt-2 text-2xl font-black text-white md:text-4xl">{row.title}</h2><p className="mt-1 text-sm text-white/45">{row.subtitle} • {row.movies.length} titles</p></div>
          <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-red-600">ปิด</button>
        </div>
        <div className="no-scrollbar grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">{row.movies.map((movie) => <MovieCard key={`category-${row.title}-${keyOf(movie)}`} movie={movie} onSelect={(item) => { onClose(); onSelect(item); }} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(movie))} />)}</div>
      </div>
    </div>
  );
}

function MovieModal({ movie, loading, onClose, onPlay, onFavorite, onGenre, onCastSearch, isFavorite }: { movie: Movie | null; loading: boolean; onClose: () => void; onPlay: (movie: Movie) => void; onFavorite: (movie: Movie) => void; onGenre: (genre: string) => void; onCastSearch: (name: string) => void; isFavorite: boolean }) {
  if (!movie) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/82 backdrop-blur-md md:items-center md:p-5">
      <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl md:max-w-6xl md:rounded-3xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600">×</button>
        <div className="relative h-64 overflow-hidden md:h-[430px]"><img src={movie.backdrop} alt={movie.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-black/45 to-transparent" />{loading ? <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white/70">กำลังโหลดข้อมูล 2 ภาษา...</div> : null}</div>
        <div className="space-y-5 px-5 pb-6 md:px-8 md:pb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-3xl font-black text-white md:text-5xl">{movie.title}</h2><p className="mt-2 text-lg font-bold text-red-100/70">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/65"><span className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-yellow-200">★ {movie.rating}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{movie.year}</span>{movie.runtime ? <span className="rounded-full bg-white/10 px-3 py-1.5">{movie.runtime}</span> : null}</div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => onPlay(movie)} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black">▶ รับชม</button><a href={`/player/${movie.mediaType}/${movie.id}`} className="rounded-xl border border-red-400/35 bg-red-600/20 px-5 py-3 text-sm font-black text-white hover:bg-red-600">เปิด Player</a><button onClick={() => onFavorite(movie)} className={`rounded-xl px-5 py-3 text-sm font-black ${isFavorite ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}>♥ {isFavorite ? 'เพิ่มแล้ว' : 'รายการโปรด'}</button></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">English Overview</p><p className="mt-2 text-sm leading-7 text-white/70">{movie.overview}</p></div><div className="rounded-2xl bg-red-500/[0.06] p-4"><p className="text-xs font-black uppercase tracking-[0.24em] text-red-200/45">เรื่องย่อภาษาไทย</p><p className="mt-2 text-sm leading-7 text-white/68">{movie.thaiOverview || 'ยังไม่มีเรื่องย่อภาษาไทยจาก TMDB'}</p></div></div>
          <div className="flex flex-wrap gap-2">{movie.genres.map((genre) => <button key={genre} onClick={() => onGenre(genre)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-red-600 hover:text-white">{genre}</button>)}{movie.thaiGenres?.map((genre) => <span key={`th-${genre}`} className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/35">{genre}</span>)}</div>
          {movie.cast?.length ? <div><h3 className="text-lg font-black text-white">นักแสดง</h3><div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-3">{movie.cast.map((person) => <button key={`${person.id}-${person.character}`} onClick={() => onCastSearch(person.name)} className="w-[92px] shrink-0 text-left"><div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/10">{person.profile ? <img src={person.profile} alt={person.name} className="h-full w-full object-cover" /> : null}</div><p className="mt-2 line-clamp-1 text-[11px] font-bold text-white">{person.name}</p><p className="line-clamp-1 text-[10px] text-white/40">{person.character}</p></button>)}</div></div> : null}
        </div>
      </div>
    </div>
  );
}

function PlayerOverlay({ movie, onClose }: { movie: Movie | null; onClose: () => void }) {
  const [adDone, setAdDone] = useState(false);
  if (!movie) return null;
  const embed = movie.trailerKey ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&rel=0` : undefined;
  return (
    <div className="fixed inset-0 z-[90] bg-black/92 p-4 backdrop-blur-lg">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black text-white">{movie.title}</p><p className="text-xs text-white/45">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p></div><button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-red-600">ปิด</button></div>
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black">{!adDone ? <div className="flex h-full flex-col items-center justify-center p-8 text-center"><p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">Sponsor Preview</p><h2 className="mt-4 text-3xl font-black text-white">โฆษณาตัวอย่างก่อนรับชม</h2><p className="mt-3 max-w-lg text-sm text-white/50">จำลอง workflow โฆษณาของเว็บเดิม ก่อนเข้าสู่ player จริง</p><button onClick={() => setAdDone(true)} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-black text-black">ข้ามโฆษณา</button></div> : embed ? <iframe src={embed} allow="autoplay; encrypted-media" allowFullScreen className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-white/45">ไม่พบ Trailer</div>}</div>
      </div>
    </div>
  );
}

function MiniModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101010] p-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-white">{title}</h3><button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">×</button></div>{children}</div></div>;
}

export function ExperienceShellBilingualV2() {
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [rows, setRows] = useState<MovieRowData[]>(fallbackRows);
  const [featured, setFeatured] = useState<Movie>(fallbackFeatured);
  const [allMovies, setAllMovies] = useState<Movie[]>(fallbackMovies);
  const [genreOptions, setGenreOptions] = useState(baseGenres);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [categoryRow, setCategoryRow] = useState<MovieRowData | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [maps, setMaps] = useState<{ en: Record<number, string>; th: Record<number, string> }>({ en: {}, th: {} });

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(`${storagePrefix}:favorites`) || '[]'));
    setUserName(localStorage.getItem(`${storagePrefix}:user`));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadHome() {
      try {
        const genreMaps = await getGenreMaps();
        setMaps({ en: genreMaps.en, th: genreMaps.th });
        const settled = await Promise.allSettled(rowDefinitions.map(async (row) => ({ title: row.title, subtitle: row.subtitle, movies: await fetchBilingualPages(row.path, genreMaps.en, genreMaps.th, row.params || {}, row.pages) })));
        const nextRows = settled.flatMap((result) => (result.status === 'fulfilled' && result.value.movies.length ? [result.value] : []));
        const merged = uniqueMovies(nextRows.flatMap((row) => row.movies));
        if (!mounted || !nextRows.length) return;
        setGenreOptions(genreMaps.options);
        setRows(nextRows);
        setAllMovies(merged);
        setFeatured(nextRows[2]?.movies[0] || nextRows[1]?.movies[0] || merged[0] || fallbackFeatured);
      } catch {
        if (!mounted) return;
        setRows(fallbackRows);
        setAllMovies(fallbackMovies);
        setFeatured(fallbackFeatured);
      }
    }
    loadHome();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const results = await searchBilingual(query, maps.en, maps.th);
        if (results.length) {
          setRows([{ title: `Search: ${query}`, subtitle: 'Thai + English TMDB search results', movies: results }]);
          setAllMovies((current) => uniqueMovies([...results, ...current]));
        }
      } catch {}
    }, 450);
    return () => clearTimeout(timer);
  }, [query, maps]);

  const filteredRows = useMemo(() => {
    if (activeGenre === 'All') return rows;
    const keyword = activeGenre.toLowerCase();
    return rows.map((row) => ({ ...row, movies: row.movies.filter((movie) => [movie.title, movie.thaiTitle, ...(movie.genres || []), ...(movie.thaiGenres || [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))) })).filter((row) => row.movies.length);
  }, [activeGenre, rows]);

  async function selectMovie(movie: Movie) {
    setSelectedMovie(movie);
    setDetailLoading(true);
    try {
      setSelectedMovie(await fetchDetails(movie, maps.en, maps.th));
    } finally {
      setDetailLoading(false);
    }
  }

  async function playMovie(movie: Movie) {
    const full = movie.trailerKey ? movie : await fetchDetails(movie, maps.en, maps.th).catch(() => movie);
    setPlayerMovie(full);
  }

  function toggleFavorite(movie: Movie) {
    const key = keyOf(movie);
    setFavorites((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      localStorage.setItem(`${storagePrefix}:favorites`, JSON.stringify(next));
      return next;
    });
  }

  function login(name: string) {
    localStorage.setItem(`${storagePrefix}:user`, name);
    setUserName(name);
    setLoginOpen(false);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Header userName={userName} favoriteCount={favorites.length} onLogin={() => setLoginOpen(true)} onPremium={() => setPremiumOpen(true)} onLogout={() => { localStorage.removeItem(`${storagePrefix}:user`); setUserName(null); }} onNotify={() => setNotifyOpen(true)} />
      <Hero movie={featured} onInfo={selectMovie} onPlay={playMovie} />
      <DiscoveryRail query={query} activeGenre={activeGenre} genreOptions={genreOptions} onQuery={setQuery} onGenre={setActiveGenre} />
      <section className="relative z-20 bg-black pb-10 pt-10">{filteredRows.map((row) => <MovieRow key={row.title} row={row} onSelect={selectMovie} onFavorite={toggleFavorite} favorites={favorites} onShowAll={setCategoryRow} />)}</section>
      <section id="portfolio" className="border-t border-white/10 bg-[#080808] px-4 py-12 text-center"><p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">Portfolio Ready</p><h2 className="mt-3 text-3xl font-black">Next.js + TMDB + Supabase-ready bilingual workflow</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">การ์ดทุกใบแสดงชื่ออังกฤษและชื่อไทยชัดเจน พร้อมต่อยอด Supabase สำหรับ login, favorite, watch history และ premium</p></section>
      <CategoryModal row={categoryRow} favorites={favorites} onClose={() => setCategoryRow(null)} onSelect={selectMovie} onFavorite={toggleFavorite} />
      <MovieModal movie={selectedMovie} loading={detailLoading} onClose={() => setSelectedMovie(null)} onPlay={playMovie} onFavorite={toggleFavorite} onGenre={setActiveGenre} onCastSearch={setQuery} isFavorite={selectedMovie ? favorites.includes(keyOf(selectedMovie)) : false} />
      <PlayerOverlay movie={playerMovie} onClose={() => setPlayerMovie(null)} />
      {loginOpen ? <MiniModal title="เข้าสู่ระบบ Demo" onClose={() => setLoginOpen(false)}><button onClick={() => login('Frank')} className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-black">เข้าสู่ระบบในชื่อ Frank</button><p className="mt-3 text-xs text-white/45">ขั้นต่อไปจะเชื่อม Supabase Auth จริง</p></MiniModal> : null}
      {premiumOpen ? <MiniModal title="Premium Demo" onClose={() => setPremiumOpen(false)}><p className="text-sm leading-7 text-white/65">เตรียมเชื่อมตาราง memberships ใน Supabase สำหรับสถานะสมาชิกจริง</p></MiniModal> : null}
      {notifyOpen ? <MiniModal title="Notifications" onClose={() => setNotifyOpen(false)}><p className="text-sm leading-7 text-white/65">เตรียมเชื่อมตาราง notifications ใน Supabase</p></MiniModal> : null}
    </main>
  );
}
