import type { Movie } from '@/types/movie';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <article className="group min-w-[155px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl transition hover:-translate-y-1 hover:bg-white/10 sm:min-w-[190px]">
      <div className="aspect-[2/3] overflow-hidden bg-white/5">
        <img
          src={movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-bold text-white">{movie.title}</h3>
        <p className="line-clamp-1 text-xs text-white/45">{movie.thaiTitle}</p>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{movie.year}</span>
          <span>★ {movie.rating}</span>
        </div>
      </div>
    </article>
  );
}
