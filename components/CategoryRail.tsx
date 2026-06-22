import { genres } from '@/lib/genres';

export function CategoryRail() {
  return (
    <section className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur-2xl">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
          <span className="rounded-full bg-black/35 px-4 py-2 text-xs text-white/50">Find title...</span>
          {genres.map((genre) => (
            <span key={genre} className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/80">
              {genre}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
