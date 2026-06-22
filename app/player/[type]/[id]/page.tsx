'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MediaType } from '@/types/movie';

const imageBase = 'https://image.tmdb.org/t/p';
const fallbackBackdrop = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop';

async function tmdb<T>(path: string, params: Record<string, string | number> = {}) {
  const search = new URLSearchParams({ path });
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const response = await fetch(`/api/tmdb?${search.toString()}`);
  if (!response.ok) throw new Error(`TMDB request failed: ${path}`);
  return (await response.json()) as T;
}

function image(path?: string | null, size = 'original') {
  return path ? `${imageBase}/${size}${path}` : undefined;
}

function getTitle(item: any) {
  return item.original_title || item.title || item.original_name || item.name || 'Untitled';
}

async function getTrailer(type: MediaType, id: string) {
  for (const language of ['th-TH', 'en-US']) {
    const data = await tmdb<{ results?: any[] }>(`/${type}/${id}/videos`, { language });
    const video =
      (data.results || []).find((item) => item.site === 'YouTube' && item.type === 'Trailer' && item.official) ||
      (data.results || []).find((item) => item.site === 'YouTube' && ['Trailer', 'Teaser'].includes(item.type)) ||
      (data.results || []).find((item) => item.site === 'YouTube');
    if (video?.key) return video.key as string;
  }
  return undefined;
}

export default function PlayerPage({ params }: { params: { type: MediaType; id: string } }) {
  const [detail, setDetail] = useState<any | null>(null);
  const [thaiDetail, setThaiDetail] = useState<any | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const type = params.type === 'tv' ? 'tv' : 'movie';

  useEffect(() => {
    let mounted = true;
    async function loadPlayer() {
      setLoading(true);
      try {
        const [en, th, credits, trailer, similar] = await Promise.all([
          tmdb<any>(`/${type}/${params.id}`, { language: 'en-US' }),
          tmdb<any>(`/${type}/${params.id}`, { language: 'th-TH' }).catch(() => null),
          tmdb<{ cast?: any[] }>(`/${type}/${params.id}/credits`, { language: 'en-US' }).catch(() => ({ cast: [] })),
          getTrailer(type, params.id).catch(() => undefined),
          tmdb<{ results?: any[] }>(`/${type}/${params.id}/similar`, { language: 'en-US', page: 1 }).catch(() => ({ results: [] })),
        ]);
        if (!mounted) return;
        setDetail(en);
        setThaiDetail(th);
        setCast((credits.cast || []).slice(0, 16));
        setTrailerKey(trailer);
        setRelated((similar.results || []).filter((item) => item.poster_path).slice(0, 18));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPlayer();
    return () => { mounted = false; };
  }, [params.id, type]);

  const title = detail ? getTitle(detail) : 'Loading...';
  const thaiTitle = thaiDetail?.title || thaiDetail?.name;
  const backdrop = image(detail?.backdrop_path) || image(detail?.poster_path) || fallbackBackdrop;
  const runtime = detail?.runtime ? `${detail.runtime} นาที` : detail?.episode_run_time?.[0] ? `${detail.episode_run_time[0]} นาที` : undefined;
  const year = (detail?.release_date || detail?.first_air_date || '').slice(0, 4) || 'N/A';
  const rating = typeof detail?.vote_average === 'number' ? detail.vote_average.toFixed(1) : '0.0';
  const embedUrl = useMemo(() => trailerKey ? `https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0` : undefined, [trailerKey]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <img src={backdrop} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(0,0,0,0.92)_42%,rgba(0,0,0,0.55)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <a href="/" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl hover:bg-white/20">← กลับหน้าแรก</a>
            <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.22em]">DOFree Player</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] shadow-2xl">
              <div className="aspect-video bg-black">
                {embedUrl ? <iframe src={embedUrl} allow="autoplay; encrypted-media" allowFullScreen className="h-full w-full" /> : <div className="flex h-full items-center justify-center p-8 text-center text-white/55">ยังไม่มีตัวอย่างอย่างเป็นทางการ</div>}
              </div>
              <div className="p-5 md:p-7">
                <h1 className="text-3xl font-black md:text-5xl">{title}</h1>
                {thaiTitle && thaiTitle !== title ? <p className="mt-2 text-sm font-semibold text-white/45">ชื่อไทย: {thaiTitle}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/65"><span className="rounded-full bg-yellow-400/15 px-3 py-1.5 text-yellow-200">★ {rating}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{year}</span>{runtime ? <span className="rounded-full bg-white/10 px-3 py-1.5">{runtime}</span> : null}{detail?.genres?.map((genre: any) => <span key={genre.id} className="rounded-full bg-white/10 px-3 py-1.5">{genre.name}</span>)}</div>
                <p className="mt-5 text-sm leading-7 text-white/68 md:text-base">{detail?.overview || (loading ? 'กำลังโหลดข้อมูล...' : 'No overview available.')}</p>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                <h2 className="text-lg font-black">นักแสดง</h2>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                  {cast.map((person) => <div key={`${person.id}-${person.character}`} className="overflow-hidden rounded-xl bg-white/5"><div className="aspect-[2/3] bg-white/10">{person.profile_path ? <img src={image(person.profile_path, 'w185')} alt={person.name} className="h-full w-full object-cover" /> : null}</div><div className="p-2"><p className="line-clamp-1 text-[11px] font-bold">{person.name}</p><p className="line-clamp-1 text-[10px] text-white/40">{person.character}</p></div></div>)}
                </div>
              </div>
            </aside>
          </div>

          {related.length ? <section className="mt-10"><h2 className="text-2xl font-black">เรื่องที่คล้ายกัน</h2><div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-4">{related.map((item) => <a key={item.id} href={`/player/${type}/${item.id}`} className="w-[120px] shrink-0 md:w-[160px]"><img src={image(item.poster_path, 'w500')} alt={getTitle(item)} className="aspect-[2/3] rounded-2xl object-cover ring-1 ring-white/10" /><p className="mt-2 line-clamp-1 text-xs font-black">{getTitle(item)}</p></a>)}</div></section> : null}
        </div>
      </section>
    </main>
  );
}
