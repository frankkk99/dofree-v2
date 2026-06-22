import type { Movie } from '@/types/movie';

export function Hero({ movie }: { movie: Movie }) {
  return (
    <section className="relative min-h-[760px] overflow-hidden pt-24">
      <img
        src={movie.backdrop}
        alt={movie.title}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      <div className="relative z-10 mx-auto flex min-h-[640px] max-w-7xl items-center px-4 md:px-8">
        <div className="max-w-2xl pt-20">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur-xl">
            Featured Portfolio UI
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">
            {movie.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">
            {movie.overview}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/65">
            <span>{movie.year}</span>
            <span>•</span>
            <span>IMDb {movie.rating}</span>
            <span>•</span>
            <span>{movie.genres.join(' / ')}</span>
          </div>
          <div className="mt-8 flex gap-3">
            <button className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/85">
              View Detail
            </button>
            <button className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20">
              Official Trailer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
