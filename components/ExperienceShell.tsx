'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { genres as fallbackGenres } from '@/lib/genres';
import { featuredMovie as fallbackFeatured, movieRows as fallbackRows, movies as fallbackMovies } from '@/lib/movies';
import type { CastMember, MediaType, Movie, MovieRowData } from '@/types/movie';

const imageBase = 'https://image.tmdb.org/t/p';
const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
const fallbackBackdrop = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop';

const baseGenres = ['All', 'Trending', 'Popular', 'Top Rated', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'TV Movie', 'Thriller', 'War', 'Western'];

const uniqueMovies = (items: Movie[]) => Array.from(new Map(items.map((movie) => [`${movie.mediaType}-${movie.id}`, movie])).values());

function yearFrom(date?: string) {
  return date?.slice(0, 4) || 'N/A';
}

function ratingFrom(value?: number) {
  return typeof value === 'number' ? value.toFixed(1) : '0.0';
}

function image(path?: string | null, size = 'w500') {
  return path ? `${imageBase}/${size}${path}` : undefined;
}

function titleOf(item: any) {
  return item.original_title || item.title || item.original_name || item.name || 'Untitled';
}

function mediaTypeOf(item: any): MediaType {
  return item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
}

function toMovie(item: any, genreMap: Record<number, string> = {}): Movie {
  const mediaType = mediaTypeOf(item);
  const title = titleOf(item);
  const thaiTitle = item.title && item.title !== title ? item.title : item.name && item.name !== title ? item.name : undefined;
  const genreNames = (item.genre_ids || item.genres?.map((genre: any) => genre.id) || [])
    .map((id: number) => genreMap[id])
    .filter(Boolean);

  return {
    id: item.id,
    mediaType,
    title,
    thaiTitle,
    year: yearFrom(item.release_date || item.first_air_date),
    rating: ratingFrom(item.vote_average),
    genres: genreNames.length ? genreNames : ['Movie'],
    overview: item.overview || 'No overview available.',
    poster: image(item.poster_path, 'w500') || fallbackPoster,
    backdrop: image(item.backdrop_path, 'original') || image(item.poster_path, 'original') || fallbackBackdrop,
  };
}

async function tmdb<T>(path: string, params: Record<string, string | number> = {}) {
  const search = new URLSearchParams({ path });
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const response = await fetch(`/api/tmdb?${search.toString()}`);
  if (!response.ok) throw new Error(`TMDB request failed: ${path}`);
  return (await response.json()) as T;
}

async function fetchPages(path: string, genreMap: Record<number, string>, params: Record<string, string | number> = {}, pages = 2) {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, index) =>
      tmdb<{ results?: any[] }>(path, { language: 'en-US', page: index + 1, ...params }),
    ),
  );
  return uniqueMovies(responses.flatMap((response) => response.results || []).filter((item) => item.poster_path).map((item) => toMovie(item, genreMap))).slice(0, 36);
}

async function fetchVideo(mediaType: MediaType, id: number) {
  const languages = ['th-TH', 'en-US'];
  for (const language of languages) {
    const data = await tmdb<{ results?: any[] }>(`/${mediaType}/${id}/videos`, { language });
    const video = (data.results || []).find((item) => item.site === 'YouTube' && ['Trailer', 'Teaser'].includes(item.type)) || (data.results || []).find((item) => item.site === 'YouTube');
    if (video?.key) return video.key as string;
  }
  return undefined;
}

async function fetchDetails(movie: Movie) {
  const [en, th, credits] = await Promise.all([
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'en-US' }),
    tmdb<any>(`/${movie.mediaType}/${movie.id}`, { language: 'th-TH' }).catch(() => null),
    tmdb<{ cast?: any[] }>(`/${movie.mediaType}/${movie.id}/credits`, { language: 'en-US' }).catch(() => ({ cast: [] })),
  ]);

  const trailerKey = await fetchVideo(movie.mediaType, movie.id).catch(() => undefined);
  const cast: CastMember[] = (credits.cast || []).slice(0, 12).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character,
    profile: image(person.profile_path, 'w185'),
  }));

  return {
    ...movie,
    title: titleOf(en) || movie.title,
    thaiTitle: th?.title || th?.name || movie.thaiTitle,
    year: yearFrom(en.release_date || en.first_air_date) || movie.year,
    rating: ratingFrom(en.vote_average),
    runtime: en.runtime ? `${en.runtime} นาที` : en.episode_run_time?.[0] ? `${en.episode_run_time[0]} นาที` : movie.runtime,
    overview: en.overview || movie.overview,
    poster: image(en.poster_path, 'w500') || movie.poster,
    backdrop: image(en.backdrop_path, 'original') || movie.backdrop,
    genres: en.genres?.map((genre: any) => genre.name) || movie.genres,
    cast: cast.length ? cast : movie.cast,
    trailerKey,
  } satisfies Movie;
}

function Header({ userName, favoriteCount, onLogin, onPremium, onLogout, onNotify }: { userName: string | null; favoriteCount: number; onLogin: () => void; onPremium: () => void; onLogout: () => void; onNotify: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/48 backdrop-blur-2xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 md:h-20 md:px-8">
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight tracking-tight text-red-500 md:text-2xl">DOFree By Frank</p>
          <p className="hidden text-xs font-medium text-white/40 sm:block">Movie discovery portfolio</p>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/60 md:flex">
          <a className="transition hover:text-white" href="#movies">Movies</a>
          <a className="transition hover:text-white" href="#categories">Categories</a>
          <a className="transition hover:text-white" href="#roadmap">Portfolio</a>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onNotify} className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm text-white/75 backdrop-blur-xl transition hover:bg-white/20 sm:inline-flex">🔔</button>
          <span className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-bold text-white/60 sm:inline-flex">♥ {favoriteCount}</span>
          <button onClick={onPremium} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-[11px] font-black text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.18)] backdrop-blur-xl transition hover:bg-amber-300 hover:text-black md:px-4 md:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Premium
          </button>
          {userName ? (
            <button onClick={onLogout} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black text-white backdrop-blur-xl transition hover:bg-white/20 md:px-4 md:text-xs">{userName}</button>
          ) : (
            <button onClick={onLogin} className="rounded-full border border-red-400/25 bg-red-600/15 px-3 py-2 text-[11px] font-black text-white backdrop-blur-xl transition hover:bg-red-600 md:px-4 md:text-xs">เข้าสู่ระบบ</button>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(239,68,68,0.10),transparent_34%),linear-gradient(90deg,#050505_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.30)_72%,rgba(0,0,0,0.78)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-7xl items-center px-4 md:min-h-[680px] md:px-8">
        <div className="max-w-2xl pt-12 md:pt-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-2xl"><span className="h-2 w-2 rounded-full bg-red-500" />Featured on DOFree</div>
          <h1 className="max-w-xl text-5xl font-black leading-none tracking-tight text-white drop-shadow-2xl md:text-7xl">{movie.title}</h1>
          {movie.thaiTitle ? <p className="mt-3 text-sm font-semibold text-white/55 md:text-base">ชื่อไทย: {movie.thaiTitle}</p> : null}
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 md:text-base">{movie.overview}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/65 md:text-sm"><span className="text-yellow-300">★ {movie.rating}</span><span>•</span><span>{movie.year}</span><span>•</span><span>{movie.genres.join(' / ')}</span></div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onPlay(movie)} className="rounded-xl bg-white px-6 py-3 text-sm font-black text-black shadow-2xl transition hover:scale-[1.02] hover:bg-white/85">▶ รับชมตัวอย่าง</button>
            <button onClick={() => onInfo(movie)} className="rounded-xl border border-white/15 bg-white/15 px-6 py-3 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/25">ⓘ ข้อมูลเพิ่มเติม</button>
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
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2 shadow-2xl backdrop-blur-2xl md:rounded-3xl">
        <div className="flex items-center gap-2">
          <label className="flex min-w-[145px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/60 md:min-w-[260px] md:px-4 md:py-3"><span className="text-white/35">⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="ค้นหา" className="w-full bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/45 md:text-sm" /></label>
          <div className="relative min-w-0 flex-[2] overflow-hidden rounded-xl border border-white/5 bg-white/[0.04] py-2"><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/80 to-transparent" /><div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/80 to-transparent" /><div className="animate-category-loop flex w-max gap-2 px-2 hover:[animation-play-state:paused]">{doubledGenres.map((genre, index) => <button type="button" key={`${genre}-${index}`} onClick={() => onGenre(genre)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold leading-none transition md:px-4 md:text-xs ${activeGenre === genre ? 'bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.35)]' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>{genre}</button>)}</div></div>
        </div>
      </div>
    </section>
  );
}

function MovieCard({ movie, onSelect, onFavorite, isFavorite }: { movie: Movie; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; isFavorite: boolean }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group w-[122px] shrink-0 text-left transition duration-300 hover:-translate-y-1 md:w-[168px]">
      <div className="relative overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10 transition group-hover:ring-red-500/50 md:rounded-2xl">
        <img src={movie.poster} alt={movie.title} className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-yellow-300 backdrop-blur-md">★ {movie.rating}</div>
        <span onClick={(event) => { event.stopPropagation(); onFavorite(movie); }} className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs backdrop-blur-md ${isFavorite ? 'bg-red-600 text-white' : 'bg-black/65 text-white/70'}`}>♥</span>
      </div>
      <div className="pt-2"><h3 className="line-clamp-1 text-xs font-black text-white md:text-sm">{movie.title}</h3><p className="line-clamp-1 text-[11px] text-white/40 md:text-xs">{movie.year} • {movie.genres[0]}</p></div>
    </button>
  );
}

function MovieRow({ row, onSelect, onFavorite, favorites }: { row: MovieRowData; onSelect: (movie: Movie) => void; onFavorite: (movie: Movie) => void; favorites: string[] }) {
  if (!row.movies.length) return null;
  return (
    <section id="movies" className="movie-row mx-auto max-w-7xl px-3 py-6 md:px-8 md:py-8">
      <div className="mb-3 flex items-end justify-between gap-4 md:mb-4"><div><h2 className="text-lg font-black text-white md:text-2xl">{row.title}</h2><p className="mt-1 hidden text-sm text-white/45 sm:block">{row.subtitle}</p></div><button className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/55 transition hover:bg-white/20 hover:text-white">ทั้งหมด</button></div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-5 md:gap-4">{row.movies.map((movie) => <MovieCard key={`${row.title}-${movie.mediaType}-${movie.id}`} movie={movie} onSelect={onSelect} onFavorite={onFavorite} isFavorite={favorites.includes(`${movie.mediaType}-${movie.id}`)} />)}</div>
    </section>
  );
}

function MovieModal({ movie, onClose, onPlay, onFavorite, isFavorite }: { movie: Movie | null; onClose: () => void; onPlay: (movie: Movie) => void; onFavorite: (movie: Movie) => void; isFavorite: boolean }) {
  if (!movie) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/82 p-0 backdrop-blur-md md:items-center md:p-5">
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl md:max-w-4xl md:rounded-3xl"><button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xl hover:bg-red-600">×</button><div className="relative h-56 overflow-hidden md:h-80"><img src={movie.backdrop} alt={movie.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-black/30 to-transparent" /></div><div className="space-y-4 px-5 pb-6 md:px-8 md:pb-8"><div><h2 className="text-3xl font-black text-white md:text-5xl">{movie.title}</h2>{movie.thaiTitle ? <p className="mt-2 text-sm font-semibold text-white/48">ชื่อไทย: {movie.thaiTitle}</p> : null}</div><div className="flex flex-wrap gap-2 text-xs font-bold text-white/65"><span className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-yellow-200">★ {movie.rating}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{movie.year}</span>{movie.runtime ? <span className="rounded-full bg-white/10 px-3 py-1.5">{movie.runtime}</span> : null}{movie.genres.map((genre) => <span key={genre} className="rounded-full bg-white/10 px-3 py-1.5">{genre}</span>)}</div><p className="text-sm leading-7 text-white/70 md:text-base">{movie.overview}</p><div className="flex flex-wrap gap-3"><button onClick={() => onPlay(movie)} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-white/85">▶ ดูตัวอย่าง</button><button onClick={() => onFavorite(movie)} className={`rounded-xl px-5 py-3 text-sm font-black ${isFavorite ? 'bg-red-600 text-white' : 'border border-white/10 bg-white/10 text-white hover:bg-white/20'}`}>♥ {isFavorite ? 'อยู่ในรายการโปรด' : 'เพิ่มรายการโปรด'}</button></div>{movie.cast?.length ? <div><h3 className="mb-3 text-sm font-black text-white/80">นักแสดง</h3><div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">{movie.cast.map((person) => <div key={person.id} className="overflow-hidden rounded-xl bg-white/5"><div className="aspect-[2/3] bg-white/10">{person.profile ? <img src={person.profile} alt={person.name} className="h-full w-full object-cover" /> : null}</div><div className="p-2"><p className="line-clamp-1 text-[11px] font-bold text-white">{person.name}</p><p className="line-clamp-1 text-[10px] text-white/40">{person.character}</p></div></div>)}</div></div> : null}</div></div>
    </div>
  );
}

function PlayerOverlay({ movie, onClose }: { movie: Movie | null; onClose: () => void }) {
  const [canSkip, setCanSkip] = useState(false);
  const [count, setCount] = useState(4);
  useEffect(() => {
    if (!movie) return;
    setCanSkip(false);
    setCount(4);
    const timer = setInterval(() => setCount((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setCanSkip(true);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [movie]);
  if (!movie) return null;
  const url = movie.trailerKey ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1` : undefined;
  return <div className="fixed inset-0 z-[90] bg-black/95 p-4"><button onClick={onClose} className="absolute right-4 top-4 z-20 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white">ปิด</button><div className="mx-auto flex h-full max-w-5xl items-center justify-center"><div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#101010]"><div className="aspect-video bg-black">{url ? <iframe src={url} allow="autoplay; encrypted-media" allowFullScreen className="h-full w-full" /> : <div className="flex h-full items-center justify-center p-8 text-center text-white/60">ยังไม่มีตัวอย่างอย่างเป็นทางการ</div>}</div><div className="flex items-center justify-between gap-4 p-4"><div><p className="font-black text-white">{movie.title}</p><p className="text-xs text-white/45">Official trailer preview</p></div>{!canSkip ? <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/70">โฆษณาจะข้ามได้ใน {count}</span> : <button onClick={onClose} className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white">ข้าม / ปิด</button>}</div></div></div></div>;
}

function SimpleModal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-white">{title}</h2><button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-white">×</button></div>{children}</div></div>;
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  return <div className="fixed bottom-4 right-4 z-50"><button onClick={() => setOpen((value) => !value)} className="rounded-full bg-red-600 px-4 py-3 text-sm font-black text-white shadow-2xl">แชท</button>{open ? <div className="mt-3 w-72 rounded-3xl border border-white/10 bg-[#121212] p-4 text-sm text-white shadow-2xl"><p className="font-black">DOFree Assistant</p><p className="mt-2 text-white/60">ระบบแชท demo สำหรับพอร์ต สามารถต่อ Firebase/Supabase ได้ภายหลัง</p></div> : null}</div>;
}

export function ExperienceShell() {
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [rows, setRows] = useState<MovieRowData[]>(fallbackRows);
  const [featured, setFeatured] = useState<Movie>(fallbackFeatured);
  const [allMovies, setAllMovies] = useState<Movie[]>(fallbackMovies);
  const [genreOptions, setGenreOptions] = useState(baseGenres);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('dofree:favorites') || '[]'));
    setUserName(localStorage.getItem('dofree:user'));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadHome() {
      try {
        const genreData = await tmdb<{ genres?: { id: number; name: string }[] }>('/genre/movie/list', { language: 'en-US' });
        const genreMap = Object.fromEntries((genreData.genres || []).map((genre) => [genre.id, genre.name]));
        const options = ['All', 'Trending', 'Popular', 'Top Rated', ...(genreData.genres || []).map((genre) => genre.name)];
        const [upcoming, popular, trending, topRated, action, animation, horror] = await Promise.all([
          fetchPages('/movie/upcoming', genreMap, {}, 2),
          fetchPages('/movie/popular', genreMap, {}, 2),
          fetchPages('/trending/movie/week', genreMap, {}, 2),
          fetchPages('/movie/top_rated', genreMap, {}, 2),
          fetchPages('/discover/movie', genreMap, { with_genres: 28, sort_by: 'popularity.desc' }, 2),
          fetchPages('/discover/movie', genreMap, { with_genres: '16,10751', sort_by: 'popularity.desc' }, 2),
          fetchPages('/discover/movie', genreMap, { with_genres: '27,53', sort_by: 'popularity.desc' }, 2),
        ]);
        const nextRows = [
          { title: 'กำลังจะเข้าฉาย', subtitle: 'Upcoming movies from TMDB', movies: upcoming },
          { title: 'ยอดนิยมตอนนี้', subtitle: 'Popular movies updated from TMDB', movies: popular },
          { title: 'กำลังมาแรง', subtitle: 'Trending this week', movies: trending },
          { title: 'คะแนนสูง', subtitle: 'Top rated movies', movies: topRated },
          { title: 'แอ็กชัน / ผจญภัย', subtitle: 'High-energy stories', movies: action },
          { title: 'ครอบครัว / แอนิเมชัน', subtitle: 'Animation and family titles', movies: animation },
          { title: 'ระทึกขวัญ / สยองขวัญ', subtitle: 'Dark and suspenseful titles', movies: horror },
        ];
        const merged = uniqueMovies(nextRows.flatMap((row) => row.movies));
        if (!mounted) return;
        setGenreOptions(options);
        setRows(nextRows);
        setAllMovies(merged);
        setFeatured(trending[0] || popular[0] || fallbackFeatured);
      } catch {
        if (!mounted) return;
        setRows(fallbackRows);
        setAllMovies(fallbackMovies);
        setFeatured(fallbackFeatured);
        setGenreOptions([...new Set([...baseGenres, ...fallbackGenres])]);
      }
    }
    loadHome();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const genreData = await tmdb<{ genres?: { id: number; name: string }[] }>('/genre/movie/list', { language: 'en-US' });
        const genreMap = Object.fromEntries((genreData.genres || []).map((genre) => [genre.id, genre.name]));
        const data = await tmdb<{ results?: any[] }>('/search/multi', { language: 'en-US', query, include_adult: 'false', page: 1 });
        const results = uniqueMovies((data.results || []).filter((item) => ['movie', 'tv'].includes(item.media_type) && item.poster_path).map((item) => toMovie(item, genreMap))).slice(0, 30);
        if (results.length) {
          setRows([{ title: `Search: ${query}`, subtitle: 'Live TMDB search results', movies: results }]);
          setAllMovies((current) => uniqueMovies([...results, ...current]));
        }
      } catch {}
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredRows = useMemo(() => {
    if (query.trim().length >= 2) return rows;
    if (activeGenre === 'All') return rows;
    const filtered = allMovies.filter((movie) => movie.genres.includes(activeGenre));
    if (filtered.length) return [{ title: activeGenre, subtitle: 'Filtered from loaded TMDB rows', movies: filtered }];
    return rows;
  }, [activeGenre, allMovies, query, rows]);

  const openDetails = async (movie: Movie) => {
    setSelectedMovie(movie);
    try { setSelectedMovie(await fetchDetails(movie)); } catch {}
  };

  const openPlayer = async (movie: Movie) => {
    setPlayerMovie(movie);
    try { setPlayerMovie(await fetchDetails(movie)); } catch {}
  };

  const toggleFavorite = (movie: Movie) => {
    const key = `${movie.mediaType}-${movie.id}`;
    setFavorites((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      localStorage.setItem('dofree:favorites', JSON.stringify(next));
      return next;
    });
  };

  const loginDemo = () => {
    localStorage.setItem('dofree:user', 'Frank');
    setUserName('Frank');
    setLoginOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('dofree:user');
    setUserName(null);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Header userName={userName} favoriteCount={favorites.length} onLogin={() => setLoginOpen(true)} onPremium={() => setPremiumOpen(true)} onLogout={logout} onNotify={() => setNotifyOpen(true)} />
      <Hero movie={featured} onInfo={openDetails} onPlay={openPlayer} />
      <DiscoveryRail query={query} activeGenre={activeGenre} genreOptions={genreOptions} onQuery={setQuery} onGenre={setActiveGenre} />
      <div className="relative z-10 pt-8 md:pt-12">{filteredRows.map((row) => <MovieRow key={row.title} row={row} onSelect={openDetails} onFavorite={toggleFavorite} favorites={favorites} />)}{filteredRows[0]?.movies.length === 0 ? <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-white/50 md:px-8">ไม่พบหนังที่ตรงกับการค้นหา</div> : null}</div>
      <section id="roadmap" className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl md:p-10"><p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">Portfolio Roadmap</p><h2 className="mt-3 max-w-2xl text-2xl font-black md:text-4xl">DOFree v2 keeps the cinematic UI while adding secure API, favorites, player, and member workflow foundations.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{['Secure TMDB API routes', 'Interactive detail modal', 'Favorites and member UI'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">{item}</div>)}</div></div></section>
      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} onPlay={openPlayer} onFavorite={toggleFavorite} isFavorite={selectedMovie ? favorites.includes(`${selectedMovie.mediaType}-${selectedMovie.id}`) : false} />
      <PlayerOverlay movie={playerMovie} onClose={() => setPlayerMovie(null)} />
      <SimpleModal open={loginOpen} title="เข้าสู่ระบบ" onClose={() => setLoginOpen(false)}><p className="text-sm text-white/60">Demo login สำหรับพอร์ต กดเพื่อจำชื่อผู้ใช้ในเครื่องนี้</p><button onClick={loginDemo} className="mt-5 w-full rounded-xl bg-red-600 py-3 text-sm font-black text-white">เข้าสู่ระบบ Demo</button></SimpleModal>
      <SimpleModal open={premiumOpen} title="Premium" onClose={() => setPremiumOpen(false)}><p className="text-sm leading-6 text-white/60">แพ็กเกจสมาชิก demo สำหรับโชว์ workflow สมัครสมาชิก สามารถต่อระบบชำระเงินจริงภายหลัง</p><label className="mt-5 block rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-white/45"><input type="file" className="hidden" />แนบสลิป demo</label></SimpleModal>
      <SimpleModal open={notifyOpen} title="แจ้งเตือน" onClose={() => setNotifyOpen(false)}><div className="space-y-3 text-sm text-white/65"><p>• หนังยอดนิยมอัปเดตจาก TMDB</p><p>• Trailer player พร้อมใช้งาน</p><p>• รายการโปรดบันทึกในเครื่อง</p></div></SimpleModal>
      <ChatWidget />
    </main>
  );
}
