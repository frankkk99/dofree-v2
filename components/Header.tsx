export function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 font-black text-white">
            D
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">DOFree v2</p>
            <p className="hidden text-xs text-white/45 sm:block">Movie discovery portfolio</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-white/65 md:flex">
          <a className="transition hover:text-white" href="#movies">Movies</a>
          <a className="transition hover:text-white" href="#categories">Categories</a>
          <a className="transition hover:text-white" href="#roadmap">Roadmap</a>
        </nav>

        <div className="flex items-center gap-2">
          <button className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 sm:px-4">
            Member
          </button>
          <button className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white sm:px-4">
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
