import { CategoryRail } from '@/components/CategoryRail';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { featuredMovie, movieRows } from '@/lib/movies';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <Hero movie={featuredMovie} />
      <CategoryRail />

      <div className="relative z-10 pt-10">
        {movieRows.map((row) => (
          <MovieRow key={row.title} title={row.title} subtitle={row.subtitle} movies={row.movies} />
        ))}
      </div>

      <section id="roadmap" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">Portfolio Roadmap</p>
          <h2 className="mt-3 text-2xl font-black md:text-4xl">Built to grow into a full movie discovery platform.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Secure TMDB API routes', 'Interactive detail modal', 'Favorites and member UI'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
