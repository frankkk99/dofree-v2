'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CastMember, Movie, MovieRowData } from '@/types/movie';
import { featuredMovie as fallbackFeatured, movieRows as fallbackRows, movies as fallbackMovies } from '@/lib/movies';

const storagePrefix = 'dofree:v4';
const keyOf = (movie: Movie) => `${movie.mediaType}-${movie.id}`;
const uniqueMovies = (items: Movie[]) => Array.from(new Map(items.map((movie) => [keyOf(movie), movie])).values());

type HomeFeed = {
  ok?: boolean;
  mode?: string;
  rowCount?: number;
  movieCount?: number;
  error?: string;
  genreOptions?: string[];
  featured?: Movie | null;
  rows?: MovieRowData[];
};

function isNowPlayingRow(row: MovieRowData) {
  return row.title.includes('กำลังฉาย') || row.subtitle.toLowerCase().includes('now playing');
}

async function tmdb<T>(path: string, params: Record<string, string | number> = {}) {
  const search = new URLSearchParams({ path });
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const response = await fetch(`/api/tmdb?${search.toString()}`);
  if (!response.ok) throw new Error(`TMDB request failed: ${path}`);
  return (await response.json()) as T;
}

const imageBase = 'https://image.tmdb.org/t/p';
function image(path?: string | null, size = 'w500') {
  return path ? `${imageBase}/${size}${path}` : undefined;
}

function titleOf(item: any) {
  return item?.title || item?.name || item?.original_title || item?.original_name;
}

async function fetchVideo(movie: Movie) {
  for (const language of ['th-TH', 'en-US']) {
    const data = await tmdb<{ results?: any[] }>(`/${movie.mediaType}/${movie.id}/videos`, { language });
    const video =
      (data.results || []).find((item) => item.site === 'YouTube' && item.type === 'Trailer' && item.official) ||
      (data.results || []).find((item) => item.site === 'YouTube' && ['Trailer', 'Teaser'].includes(item.type)) ||
      (data.results || []).find((item) => item.site === 'YouTube');
    if (video?.key) return video.key as string;
  }
  return undefined;
}

async function fetchDetails(movie: Movie) {
  const [en, th, credits, trailerKey] = await Promise.all([
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'en-US' }).catch(() => null),
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'th-TH' }).catch(() => null),
    tmdb<{ cast?: any[] }>(`/${movie.mediaType}/${movie.id}/credits`, { language: 'en-US' }).catch(() => ({ cast: [] })),
    fetchVideo(movie).catch(() => undefined),
  ]);

  const cast: CastMember[] = (credits.cast || []).slice(0, 24).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character,
    profile: image(person.profile_path, 'w185'),
  }));

  return {
    ...movie,
    title: titleOf(en) || movie.title,
    thaiTitle: titleOf(th) || movie.thaiTitle,
    overview: en?.overview || movie.overview,
    thaiOverview: th?.overview || movie.thaiOverview,
    runtime: en?.runtime ? `${en.runtime} นาที` : en?.episode_run_time?.[0] ? `${en.episode_run_time[0]} นาที` : movie.runtime,
    poster: image(en?.poster_path || th?.poster_path, 'w500') || movie.poster,
    backdrop: image(en?.backdrop_path || th?.backdrop_path, 'original') || movie.backdrop,
    cast: cast.length ? cast : movie.cast,
    trailerKey,
  } satisfies Movie;
}

function Header({ userName, favoriteCount, onLogin, onPremium, onLogout, onNotify }: { userName: string | null; favoriteCount: number; onLogin: () => void; onPremium: () => void; onLogout: () => void; onNotify: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/65 backdrop-blur-2xl">
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
          <span className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-bold text-white/55 sm:block">♥ {favoriteCount}</span>
          <button onClick={onPremium} className="rounded-full border border-yellow-300/40 bg-yellow-300/15 px-3 py-2 text-[11px] font-black text-yellow-100">Premium</button>
          {userName ? <button onClick={onLogout} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black text-white">{userName}</button> : <button onClick={onLogin} className="rounded-full border border-red-400/25 bg-red-600/15 px-3 py-2 text-[11px] font-black text-white hover:bg-red-600">เข้าสู่ระบบ</button>}
        </div>
      </div>
    </header>
  );
}

function Hero({ movie, status, onInfo, onPlay }: { movie: Movie; status: string; onInfo: (movie: Movie) => void; onPlay: (movie: Movie) => void }) {
  return (
    <section className="relative min-h-[620px] overflow-hidden pt-20 md:min-h-[760px]">
      <img src={movie.backdrop} alt={movie.title} loading="eager" decoding="async" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-75" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(0,0,0,0.90)_35%,rgba(0,0,0,0.35)_72%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/90 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-center px-4 md:min-h-[650px] md:px-8">
        <div className="max-w-2xl pt-12 md:pt-20">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-2xl">{status}</div>
          <h1 className="max-w-xl text-5xl font-black leading-none tracking-tight text-white md:text-7xl">{movie.title}</h1>
          <p className="mt-3 text-lg font-bold text-red-100/80">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 md:text-base">{movie.overview}</p>
          {movie.thaiOverview ? <p className="mt-3 max-w-xl text-sm leading-7 text-white/58 md:text-base">{movie.thaiOverview}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-white/65">
            <span className="text-yellow-300">★ {movie.rating}</span><span>{movie.year}</span><span>{movie.genres.join(' / ')}</span>
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

function DiscoveryDock({ query, activeGenre, genreOptions, onQuery, onGenre }: { query: string; activeGenre: string; genreOptions: string[]; onQuery: (value: string) => void; onGenre: (value: string) => void }) {
  return (
    <section id="categories" className="relative z-30 mx-auto -mt-24 max-w-7xl px-3 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-black/50 p-3 shadow-2xl backdrop-blur-2xl">
        <div className="grid gap-3 md:grid-cols-[320px_1fr]">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-xs text-white/60">
            <span>⌕</span>
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="ค้นหาไทย / English" className="w-full bg-transparent font-semibold text-white outline-none placeholder:text-white/45" />
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-xl bg-white/[0.04] p-2">
            {genreOptions.map((genre) => <button key={genre} onClick={() => onGenre(genre)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${activeGenre === genre ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{genre}</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function BilingualTitle({ movie }: { movie: Movie }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black text-white/45">EN</span>
        <h3 className="line-clamp-1 text-xs font-black text-white md:text-sm">{movie.title}</h3>
      </div>
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[8px] font-black text-red-100/70">TH</span>
        <p className="line-clamp-1 text-[11px] font-semibold text-red-100/65">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p>
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelect, onFavorite, isFavorite, compact = false }: { movie: Movie; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; isFavorite: boolean; compact?: boolean }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group min-w-0 text-left transition duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10 transition group-hover:ring-red-500/50">
        <img src={movie.poster} alt={movie.title} loading="lazy" decoding="async" className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-yellow-300">★ {movie.rating}</div>
        <span onClick={(event) => { event.stopPropagation(); onFavorite(movie); }} className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs ${isFavorite ? 'bg-red-600 text-white' : 'bg-black/65 text-white/70'}`}>♥</span>
      </div>
      <div className="pt-2">
        <BilingualTitle movie={movie} />
        {!compact ? <p className="mt-1 line-clamp-1 text-[11px] text-white/40">{movie.year} • {movie.genres[0]}{movie.thaiGenres?.[0] ? ` • ${movie.thaiGenres[0]}` : ''}</p> : null}
      </div>
    </button>
  );
}

function AutoNowPlayingRow({ row, favorites, onSelect, onFavorite, onShowAll }: { row: MovieRowData; favorites: string[]; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; onShowAll: (row: MovieRowData) => void }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const preview = row.movies.slice(0, 40);

  useEffect(() => {
    if (paused) return;
    const rail = railRef.current;
    if (!rail) return;
    const timer = window.setInterval(() => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 0) return;
      if (rail.scrollLeft >= maxScroll - 3) {
        rail.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        rail.scrollBy({ left: 1.4, behavior: 'auto' });
      }
    }, 20);
    return () => window.clearInterval(timer);
  }, [paused, row.movies.length]);

  const nudge = (direction: 'left' | 'right') => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction === 'right' ? rail.clientWidth * 0.8 : -rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="movies" className="mx-auto max-w-7xl px-3 py-8 md:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-red-200">Auto carousel</div>
          <h2 className="mt-2 text-xl font-black text-white md:text-3xl">{row.title}</h2>
          <p className="mt-1 text-sm text-white/45">{row.subtitle} • {row.movies.length} เรื่อง • แตะ/ลากเพื่อเลื่อนเองได้</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => nudge('left')} className="hidden h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 md:block">‹</button>
          <button onClick={() => nudge('right')} className="hidden h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 md:block">›</button>
          <button onClick={() => onShowAll(row)} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/65 hover:bg-white/20 hover:text-white">ทั้งหมด</button>
        </div>
      </div>
      <div
        ref={railRef}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => window.setTimeout(() => setPaused(false), 1200)}
        onPointerCancel={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => window.setTimeout(() => setPaused(false), 1200)}
        className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth pb-3"
      >
        {preview.map((movie) => (
          <div key={`now-playing-${keyOf(movie)}`} className="w-[43vw] shrink-0 snap-start sm:w-[28vw] md:w-[190px] lg:w-[205px]">
            <MovieCard movie={movie} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(movie))} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MovieRow({ row, favorites, onSelect, onFavorite, onShowAll, searchMode = false }: { row: MovieRowData; favorites: string[]; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; onShowAll: (row: MovieRowData) => void; searchMode?: boolean }) {
  if (!row.movies.length) return null;
  const preview = row.movies.slice(0, searchMode ? 48 : 18);
  return (
    <section id="movies" className="mx-auto max-w-7xl px-3 py-7 md:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white md:text-2xl">{row.title}</h2>
          <p className="mt-1 text-sm text-white/45">{row.subtitle} • {row.movies.length} เรื่อง</p>
        </div>
        <button onClick={() => onShowAll(row)} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/65 hover:bg-white/20 hover:text-white">ทั้งหมด</button>
      </div>
      <div className={searchMode ? 'grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8' : 'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8'}>
        {preview.map((movie) => <MovieCard key={`${row.title}-${keyOf(movie)}`} movie={movie} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(movie))} compact={searchMode} />)}
      </div>
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
        <div className="no-scrollbar grid flex-1 grid-cols-4 gap-2 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
          {row.movies.map((movie) => <MovieCard key={`category-${row.title}-${keyOf(movie)}`} movie={movie} onSelect={(item) => { onClose(); onSelect(item); }} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(movie))} compact />)}
        </div>
      </div>
    </div>
  );
}

function MovieModal({ movie, loading, favorites, recommendations, onClose, onPlay, onFavorite, onGenre, onCastSearch, onSelectRecommended }: { movie: Movie | null; loading: boolean; favorites: string[]; recommendations: Movie[]; onClose: () => void; onPlay: (movie: Movie) => void; onFavorite: (movie: Movie) => void; onGenre: (genre: string) => void; onCastSearch: (name: string) => void; onSelectRecommended: (movie: Movie) => void }) {
  if (!movie) return null;
  const favorite = favorites.includes(keyOf(movie));
  const teaserEmbed = movie.trailerKey ? `https://www.youtube.com/embed/${movie.trailerKey}?rel=0` : undefined;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/82 backdrop-blur-md md:items-center md:p-5">
      <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl md:max-w-6xl md:rounded-3xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600">×</button>
        <div className="relative h-56 overflow-hidden md:h-[360px]">
          <img src={movie.backdrop} alt={movie.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-black/45 to-transparent" />
          {loading ? <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white/70">กำลังโหลดรายละเอียด...</div> : null}
        </div>
        <div className="space-y-7 px-5 pb-6 md:px-8 md:pb-8">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-300/60">1. Summary / สรุปหนัง</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{movie.overview}</p>
            <p className="mt-3 text-sm leading-7 text-red-50/65">{movie.thaiOverview || 'ยังไม่มีเรื่องย่อภาษาไทยจาก TMDB'}</p>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-red-300/60">2. Teaser / Trailer</p>
            <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
              {teaserEmbed ? <iframe src={teaserEmbed} allow="autoplay; encrypted-media" allowFullScreen className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-sm text-white/45">ไม่พบ Teaser / Trailer</div>}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-300/60">3. Title / ข้อมูลเรื่องจริง</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">{movie.title}</h2>
              <p className="mt-2 text-lg font-bold text-red-100/70">{movie.thaiTitle || 'ยังไม่มีชื่อไทย'}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/65"><span className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-yellow-200">★ {movie.rating}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{movie.year}</span>{movie.runtime ? <span className="rounded-full bg-white/10 px-3 py-1.5">{movie.runtime}</span> : null}</div>
              <div className="mt-3 flex flex-wrap gap-2">{movie.genres.map((genre) => <button key={genre} onClick={() => onGenre(genre)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-red-600 hover:text-white">{genre}</button>)}{movie.thaiGenres?.map((genre) => <span key={`th-${genre}`} className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/35">{genre}</span>)}</div>
            </div>
            <div className="flex flex-wrap gap-2"><button onClick={() => onPlay(movie)} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black">▶ รับชม</button><a href={`/player/${movie.mediaType}/${movie.id}`} className="rounded-xl border border-red-400/35 bg-red-600/20 px-5 py-3 text-sm font-black text-white hover:bg-red-600">เปิด Player</a><button onClick={() => onFavorite(movie)} className={`rounded-xl px-5 py-3 text-sm font-black ${favorite ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}>♥ {favorite ? 'เพิ่มแล้ว' : 'รายการโปรด'}</button></div>
          </section>

          {movie.cast?.length ? <section><p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-300/60">4. Cast / นักแสดง</p><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">{movie.cast.map((person) => <button key={`${person.id}-${person.character}`} onClick={() => onCastSearch(person.name)} className="text-left"><div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/10">{person.profile ? <img src={person.profile} alt={person.name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}</div><p className="mt-2 line-clamp-1 text-[11px] font-bold text-white">{person.name}</p><p className="line-clamp-1 text-[10px] text-white/40">{person.character}</p></button>)}</div></section> : null}

          {recommendations.length ? <section><p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-300/60">5. Recommended / หนังแนะนำ</p><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">{recommendations.map((item) => <MovieCard key={`rec-${keyOf(item)}`} movie={item} onSelect={onSelectRecommended} onFavorite={onFavorite} isFavorite={favorites.includes(keyOf(item))} compact />)}</div></section> : null}
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

export function ExperienceShellBilingualV4() {
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [rows, setRows] = useState<MovieRowData[]>(fallbackRows);
  const [featured, setFeatured] = useState<Movie>(fallbackFeatured);
  const [allMovies, setAllMovies] = useState<Movie[]>(fallbackMovies);
  const [genreOptions, setGenreOptions] = useState(['All', 'Trending', 'Popular', 'Top Rated', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller']);
  const [feedStatus, setFeedStatus] = useState('กำลังโหลด TMDB 2 ภาษา...');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [categoryRow, setCategoryRow] = useState<MovieRowData | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(`${storagePrefix}:favorites`) || '[]'));
    setUserName(localStorage.getItem(`${storagePrefix}:user`));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadHome() {
      try {
        const response = await fetch('/api/tmdb/home?pages=3', { cache: 'no-store' });
        const data = (await response.json()) as HomeFeed;
        if (!response.ok || !data.rows?.length) throw new Error(data.error || 'TMDB feed returned no rows');
        const merged = uniqueMovies(data.rows.flatMap((row) => row.movies));
        if (!mounted) return;
        setRows(data.rows);
        setAllMovies(merged);
        setFeatured(data.featured || merged[0] || fallbackFeatured);
        setGenreOptions(data.genreOptions?.length ? data.genreOptions : genreOptions);
        setFeedStatus(`TMDB Live • ${data.movieCount || merged.length} เรื่อง • ${data.rowCount || data.rows.length} หมวด • TH/EN`);
      } catch (error) {
        if (!mounted) return;
        setRows(fallbackRows);
        setAllMovies(fallbackMovies);
        setFeatured(fallbackFeatured);
        setFeedStatus(`Fallback mode: ${error instanceof Error ? error.message : 'TMDB feed failed'} — ตรวจ ENV TMDB ใน Vercel`);
      }
    }
    loadHome();
    return () => { mounted = false; };
  }, []);

  const filteredRows = useMemo(() => {
    let sourceRows = rows;
    if (query.trim().length >= 2) {
      const q = query.toLowerCase();
      const results = allMovies.filter((movie) => [movie.title, movie.thaiTitle, movie.overview, movie.thaiOverview, ...(movie.genres || []), ...(movie.thaiGenres || [])].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
      sourceRows = [{ title: `Search: ${query}`, subtitle: 'ค้นหาจากหนังที่โหลดมาแล้ว', movies: results }];
    }
    if (activeGenre !== 'All') {
      sourceRows = sourceRows.map((row) => ({ ...row, movies: row.movies.filter((movie) => movie.genres.includes(activeGenre) || movie.thaiGenres?.includes(activeGenre)) })).filter((row) => row.movies.length);
    }
    return sourceRows;
  }, [rows, allMovies, query, activeGenre]);

  const recommendations = useMemo(() => {
    if (!selectedMovie) return [];
    const genreSet = new Set([...(selectedMovie.genres || []), ...(selectedMovie.thaiGenres || [])]);
    return allMovies.filter((movie) => keyOf(movie) !== keyOf(selectedMovie) && [...genreSet].some((genre) => movie.genres.includes(genre) || movie.thaiGenres?.includes(genre))).slice(0, 12);
  }, [selectedMovie, allMovies]);

  const toggleFavorite = (movie: Movie) => {
    const id = keyOf(movie);
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(`${storagePrefix}:favorites`, JSON.stringify(next));
      return next;
    });
  };

  const selectMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    setDetailLoading(true);
    const detailed = await fetchDetails(movie).catch(() => movie);
    setSelectedMovie(detailed);
    setDetailLoading(false);
  };

  const playMovie = async (movie: Movie) => {
    const detailed = movie.trailerKey ? movie : await fetchDetails(movie).catch(() => movie);
    setPlayerMovie(detailed);
  };

  const searchCast = (name: string) => {
    setQuery(name);
    setSelectedMovie(null);
  };

  const jumpGenre = (genre: string) => {
    setActiveGenre(genre);
    setSelectedMovie(null);
  };

  const loginDemo = () => {
    const name = 'Frank';
    localStorage.setItem(`${storagePrefix}:user`, name);
    setUserName(name);
    setLoginOpen(false);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Header userName={userName} favoriteCount={favorites.length} onLogin={() => setLoginOpen(true)} onPremium={() => setPremiumOpen(true)} onLogout={() => { localStorage.removeItem(`${storagePrefix}:user`); setUserName(null); }} onNotify={() => setNotifyOpen(true)} />
      <Hero movie={featured} status={feedStatus} onInfo={selectMovie} onPlay={playMovie} />
      <DiscoveryDock query={query} activeGenre={activeGenre} genreOptions={genreOptions} onQuery={setQuery} onGenre={setActiveGenre} />

      <div className="pb-16 pt-8">
        {filteredRows.map((row, index) => {
          const searchMode = query.trim().length >= 2;
          if (!searchMode && activeGenre === 'All' && isNowPlayingRow(row)) {
            return <AutoNowPlayingRow key={`${row.title}-${index}`} row={row} favorites={favorites} onSelect={selectMovie} onFavorite={toggleFavorite} onShowAll={setCategoryRow} />;
          }
          return <MovieRow key={`${row.title}-${index}`} row={row} favorites={favorites} onSelect={selectMovie} onFavorite={toggleFavorite} onShowAll={setCategoryRow} searchMode={searchMode} />;
        })}
      </div>

      <CategoryModal row={categoryRow} favorites={favorites} onClose={() => setCategoryRow(null)} onSelect={selectMovie} onFavorite={toggleFavorite} />
      <MovieModal movie={selectedMovie} loading={detailLoading} favorites={favorites} recommendations={recommendations} onClose={() => setSelectedMovie(null)} onPlay={playMovie} onFavorite={toggleFavorite} onGenre={jumpGenre} onCastSearch={searchCast} onSelectRecommended={selectMovie} />
      <PlayerOverlay movie={playerMovie} onClose={() => setPlayerMovie(null)} />

      {loginOpen ? <MiniModal title="เข้าสู่ระบบ Demo" onClose={() => setLoginOpen(false)}><p className="text-sm text-white/55">ขั้นต่อไปจะเชื่อม Supabase Auth จริง</p><button onClick={loginDemo} className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">เข้าสู่ระบบเป็น Frank</button></MiniModal> : null}
      {premiumOpen ? <MiniModal title="Premium Demo" onClose={() => setPremiumOpen(false)}><p className="text-sm leading-6 text-white/55">เตรียมเชื่อม Supabase memberships สำหรับสถานะ Premium, ประวัติการชำระเงิน และสิทธิ์การดู</p></MiniModal> : null}
      {notifyOpen ? <MiniModal title="Notifications" onClose={() => setNotifyOpen(false)}><p className="text-sm leading-6 text-white/55">เตรียมเชื่อมตาราง notifications สำหรับข่าวหนังใหม่และสถานะสมาชิก</p></MiniModal> : null}
    </main>
  );
}
