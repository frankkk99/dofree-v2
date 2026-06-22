import type { Movie } from '@/types/movie';
import { MovieCard } from '@/components/MovieCard';

export function MovieRow({ title, subtitle, movies }: { title: string; subtitle: string; movies: Movie[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8" id="movies">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>
        <button className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white sm:block">
          View all
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
