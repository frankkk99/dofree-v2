'use client';

import { useMemo, useState } from 'react';
import { genres } from '@/lib/genres';
import { featuredMovie, movieRows, movies } from '@/lib/movies';
import type { Movie } from '@/types/movie';

const doubledGenres = [...genres, ...genres];

function includesQuery(movie: Movie, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [movie.title, movie.thaiTitle, movie.year, ...movie.genres]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}

function filterByGenre(movie: Movie, activeGenre: string) {
  if (['All', 'Trending', 'Popular', 'Top Rated'].includes(activeGenre)) return true;
  return movie.genres.includes(activeGenre);
}

function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl transition-colors">
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
          <button className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-[11px] font-black text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.18)] backdrop-blur-xl transition hover:bg-amber-300 hover:text-black md:px-4 md:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Premium
          </button>
          <button className="rounded-full border border-red-400/25 bg-red-600/15 px-3 py-2 text-[11px] font-black text-white backdrop-blur-xl transition hover:bg-red-600 md:px-4 md:text-xs">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onSelect }: { onSelect: (movie: Movie) => void }) {
  return (
    <section className="relative min-h-[720px] overflow-hidden pt-20 md:min-h-[820px]">
      <img
        src={featuredMovie.backdrop}
        alt={featuredMovie.title}
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-75"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(239,68,68,0.10),transparent_34%),linear-gradient(90deg,#050505_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.30)_72%,rgba(0,0,0,0.78)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-7xl items-center px-4 md:min-h-[680px] md:px-8">
        <div className="max-w-2xl pt-12 md:pt-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-2xl">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Featured on DOFree
          </div>

          <h1 className="max-w-xl text-5xl font-black leading-none tracking-tight text-white drop-shadow-2xl md:text-7xl">
            {featuredMovie.title}
          </h1>
          <p className="mt-3 text-sm font-semibold text-white/55 md:text-base">ชื่อไทย: {featuredMovie.thaiTitle}</p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 md:text-base">
            {featuredMovie.overview}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/65 md:text-sm">
            <span className="text-yellow-300">★ {featuredMovie.rating}</span>
            <span>•</span>
            <span>{featuredMovie.year}</span>
            <span>•</span>
            <span>{featuredMovie.genres.join(' / ')}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onSelect(featuredMovie)}
              className="rounded-xl bg-white px-6 py-3 text-sm font-black text-black shadow-2xl transition hover:scale-[1.02] hover:bg-white/85"
            >
              ▶ รับชมตัวอย่าง
            </button>
            <button
              onClick={() => onSelect(featuredMovie)}
              className="rounded-xl border border-white/15 bg-white/15 px-6 py-3 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/25"
            >
              ⓘ ข้อมูลเพิ่มเติม
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryRail({
  query,
  activeGenre,
  onQuery,
  onGenre,
}: {
  query: string;
  activeGenre: string;
  onQuery: (value: string) => void;
  onGenre: (value: string) => void;
}) {
  return (
    <section id="categories" className="category-dock relative z-30 mx-auto -mt-28 max-w-7xl px-3 md:-mt-24 md:px-8">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2 shadow-2xl backdrop-blur-2xl md:rounded-3xl">
        <div className="flex items-center gap-2">
          <label className="flex min-w-[145px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/60 md:min-w-[260px] md:px-4 md:py-3">
            <span className="text-white/35">⌕</span>
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="ค้นหา"
              className="w-full bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/45 md:text-sm"
            />
          </label>

          <div className="relative min-w-0 flex-[2] overflow-hidden rounded-xl border border-white/5 bg-white/[0.04] py-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/80 to-transparent" />
            <div className="animate-category-loop flex w-max gap-2 px-2 hover:[animation-play-state:paused]">
              {doubledGenres.map((genre, index) => (
                <button
                  type="button"
                  key={`${genre}-${index}`}
                  onClick={() => onGenre(genre)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold leading-none transition md:px-4 md:text-xs ${
                    activeGenre === genre
                      ? 'bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.35)]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: (movie: Movie) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(movie)}
      className="group w-[122px] shrink-0 text-left transition duration-300 hover:-translate-y-1 md:w-[168px]"
    >
      <div className="relative overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10 transition group-hover:ring-red-500/50 md:rounded-2xl">
        <img
          src={movie.poster}
          alt={movie.title}
          className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-yellow-300 backdrop-blur-md">
          ★ {movie.rating}
        </div>
      </div>
      <div className="pt-2">
        <h3 className="line-clamp-1 text-xs font-black text-white md:text-sm">{movie.title}</h3>
        <p className="line-clamp-1 text-[11px] text-white/40 md:text-xs">{movie.year} • {movie.genres[0]}</p>
      </div>
    </button>
  );
}

function MovieRow({ row, onSelect }: { row: (typeof movieRows)[number]; onSelect: (movie: Movie) => void }) {
  return (
    <section id="movies" className="movie-row mx-auto max-w-7xl px-3 py-6 md:px-8 md:py-8">
      <div className="mb-3 flex items-end justify-between gap-4 md:mb-4">
        <div>
          <h2 className="text-lg font-black text-white md:text-2xl">{row.title}</h2>
          <p className="mt-1 hidden text-sm text-white/45 sm:block">{row.subtitle}</p>
        </div>
        <button className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/55 transition hover:bg-white/20 hover:text-white">
          ทั้งหมด
        </button>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-5 md:gap-4">
        {row.movies.map((movie) => (
          <MovieCard key={`${row.title}-${movie.id}`} movie={movie} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function MovieModal({ movie, onClose }: { movie: Movie | null; onClose: () => void }) {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/82 p-0 backdrop-blur-md md:items-center md:p-5">
      <div className="relative max-h-[92vh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl md:max-w-3xl md:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xl hover:bg-red-600"
        >
          ×
        </button>

        <div className="relative h-56 overflow-hidden md:h-80">
          <img src={movie.backdrop} alt={movie.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-black/30 to-transparent" />
        </div>

        <div className="space-y-4 px-5 pb-6 md:px-8 md:pb-8">
          <div>
            <h2 className="text-3xl font-black text-white md:text-5xl">{movie.title}</h2>
            {movie.thaiTitle ? <p className="mt-2 text-sm font-semibold text-white/48">ชื่อไทย: {movie.thaiTitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-white/65">
            <span className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-yellow-200">★ {movie.rating}</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">{movie.year}</span>
            {movie.genres.map((genre) => (
              <span key={genre} className="rounded-full bg-white/10 px-3 py-1.5">{genre}</span>
            ))}
          </div>
          <p className="text-sm leading-7 text-white/70 md:text-base">{movie.overview}</p>
          <div className="flex gap-3">
            <a
              href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} official trailer`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-white/85"
            >
              ดูตัวอย่าง
            </a>
            <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExperienceShell() {
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const filteredMovies = useMemo(
    () => movies.filter((movie) => includesQuery(movie, query) && filterByGenre(movie, activeGenre)),
    [query, activeGenre],
  );

  const filteredRows = useMemo(() => {
    if (!query && activeGenre === 'All') return movieRows;
    return [
      {
        title: query ? `Search: ${query}` : activeGenre,
        subtitle: 'Results from the local portfolio movie dataset',
        movies: filteredMovies,
      },
    ];
  }, [activeGenre, filteredMovies, query]);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Header />
      <Hero onSelect={setSelectedMovie} />
      <DiscoveryRail query={query} activeGenre={activeGenre} onQuery={setQuery} onGenre={setActiveGenre} />

      <div className="relative z-10 pt-8 md:pt-12">
        {filteredRows.map((row) => (
          <MovieRow key={row.title} row={row} onSelect={setSelectedMovie} />
        ))}
        {filteredRows[0]?.movies.length === 0 ? (
          <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-white/50 md:px-8">ไม่พบหนังที่ตรงกับการค้นหา</div>
        ) : null}
      </div>

      <section id="roadmap" className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">Portfolio Roadmap</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-black md:text-4xl">Built as a clean movie discovery portfolio with room for real API, auth, and admin features.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Secure TMDB API routes', 'Interactive detail modal', 'Favorites and member UI'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}
