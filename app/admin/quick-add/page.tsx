'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type MediaType = 'movie' | 'tv';

type TmdbResult = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
};

type Status = 'พร้อมใช้งาน' | 'กำลังโหลด' | 'ต้องเป็น Admin ก่อน' | 'ยังไม่ได้เข้าสู่ระบบ';

const posterUrl = (path?: string | null) => path ? `https://image.tmdb.org/t/p/w342${path}` : '';
const yearOf = (item?: TmdbResult | null) => (item?.release_date || item?.first_air_date || '').slice(0, 4);
const titleOf = (item?: TmdbResult | null) => item?.title || item?.name || item?.original_title || item?.original_name || '';

function normalizeGoogleDriveUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match?.[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return trimmed;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-white/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-red-500/70"
      />
    </label>
  );
}

export default function QuickAddPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<Status>('กำลังโหลด');
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [tmdbId, setTmdbId] = useState('');
  const [watchUrl, setWatchUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [provider, setProvider] = useState('Google Drive');
  const [titleTh, setTitleTh] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
  const [selected, setSelected] = useState<TmdbResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setStatus('ต้องเป็น Admin ก่อน');
      return;
    }

    async function init() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setSessionEmail(user?.email || null);
      if (!user) {
        setStatus('ยังไม่ได้เข้าสู่ระบบ');
        return;
      }
      const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setStatus(profile.data?.role === 'admin' ? 'พร้อมใช้งาน' : 'ต้องเป็น Admin ก่อน');
    }

    init();
    const { data: listener } = supabase.auth.onAuthStateChange(() => init());
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const login = async () => {
    if (!supabase || !email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/quick-add` },
    });
    setMessage(error ? error.message : 'ส่งลิงก์เข้าสู่ระบบไปที่อีเมลแล้ว');
  };

  const fetchDetails = async (id: number, type: MediaType) => {
    const [thaiRes, englishRes] = await Promise.all([
      fetch(`/api/tmdb?path=/${type}/${id}&language=th-TH`).then((res) => res.json()),
      fetch(`/api/tmdb?path=/${type}/${id}&language=en-US`).then((res) => res.json()),
    ]);

    if (thaiRes?.id) {
      setSelected(thaiRes);
      setTmdbId(String(thaiRes.id));
      setTitleTh(titleOf(thaiRes));
      setTitleEn(titleOf(englishRes?.id ? englishRes : thaiRes));
      setNotes(`เพิ่มแบบเร็ว • คะแนน ${Number(thaiRes.vote_average || 0).toFixed(1)} • ปี ${yearOf(thaiRes) || '-'}`);
      setMessage(`เลือก ${titleOf(thaiRes)} แล้ว`);
    } else {
      setMessage(thaiRes?.error || 'ไม่พบข้อมูล TMDB ID นี้');
    }
  };

  const searchTmdb = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setMessage('กำลังค้นหา TMDB...');
    try {
      const params = new URLSearchParams({
        path: `/search/${mediaType}`,
        language: 'th-TH',
        query: query.trim(),
        page: '1',
        include_adult: 'false',
      });
      const data = await fetch(`/api/tmdb?${params.toString()}`).then((res) => res.json());
      setSearchResults((data.results || []).slice(0, 8));
      setMessage(data.results?.length ? 'เลือกเรื่องที่ต้องการเพิ่ม' : 'ไม่พบผลลัพธ์ ลองค้นด้วยชื่ออังกฤษหรือ TMDB ID');
    } catch {
      setMessage('ค้นหาไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const loadById = async () => {
    const id = Number(tmdbId);
    if (!id) {
      setMessage('ใส่ TMDB ID ก่อน');
      return;
    }
    setBusy(true);
    try {
      await fetchDetails(id, mediaType);
    } finally {
      setBusy(false);
    }
  };

  const saveLink = async (active: boolean) => {
    if (!supabase) return;
    const id = Number(tmdbId);
    if (!id) {
      setMessage('ต้องมี TMDB ID ก่อน');
      return;
    }
    if (!watchUrl.trim()) {
      setMessage('ต้องใส่ลิงก์ Google Drive หรือ watch URL ก่อน');
      return;
    }

    setBusy(true);
    const normalizedWatchUrl = normalizeGoogleDriveUrl(watchUrl);
    const payload = {
      tmdb_id: id,
      media_type: mediaType,
      title: titleEn || null,
      title_th: titleTh || null,
      watch_url: normalizedWatchUrl,
      trailer_url: trailerUrl || null,
      provider: provider || 'Google Drive',
      notes: notes || null,
      is_active: active,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_movie_links').upsert(payload, { onConflict: 'tmdb_id,media_type' });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setWatchUrl(normalizedWatchUrl);
    setMessage(active ? 'บันทึกและเผยแพร่แล้ว ถ้าคะแนน 8+ จะขึ้นหมวดดูได้แล้ว' : 'บันทึกแบบร่างแล้ว');
  };

  const canUse = status === 'พร้อมใช้งาน';

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300/70">DOFree Admin</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">เพิ่มหนังแบบเร็ว</h1>
            <p className="mt-2 text-sm text-white/45">ค้นหา TMDB แล้ววาง Google Drive link เพื่อเผยแพร่ทันที</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <Link href="/admin" className="rounded-full bg-white/10 px-4 py-2 text-white/75">กลับ Admin</Link>
            <Link href="/" className="rounded-full bg-white/10 px-4 py-2 text-white/75">ดูหน้าเว็บ</Link>
          </div>
        </header>

        {message ? <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">{message}</div> : null}

        {!supabase ? (
          <section className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50">ยังไม่ได้ตั้งค่า Supabase ENV ใน Vercel</section>
        ) : status === 'ยังไม่ได้เข้าสู่ระบบ' ? (
          <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-black">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="mt-2 text-sm text-white/45">ใส่อีเมลที่กำหนดเป็น admin ใน Supabase</p>
            <div className="mt-5 space-y-4">
              <Field label="Email" value={email} onChange={setEmail} placeholder="admin@email.com" type="email" />
              <button onClick={login} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">ส่งลิงก์เข้าสู่ระบบ</button>
            </div>
          </section>
        ) : status === 'ต้องเป็น Admin ก่อน' ? (
          <section className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6">
            <h2 className="text-xl font-black text-yellow-100">บัญชีนี้ยังไม่ได้เป็นผู้ดูแล</h2>
            <p className="mt-2 text-sm text-yellow-50/65">{sessionEmail || 'บัญชีนี้'} ต้องถูกตั้ง role เป็น admin ก่อน</p>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-black">1. ค้นหาเรื่อง</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-white/45">ประเภท</span>
                  <select value={mediaType} onChange={(event) => setMediaType(event.target.value as MediaType)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none">
                    <option value="movie">movie</option>
                    <option value="tv">tv</option>
                  </select>
                </label>
                <Field label="ค้นหาชื่อหนัง / ซีรีส์" value={query} onChange={setQuery} placeholder="เช่น Interstellar, ดาบพิฆาตอสูร" />
                <button disabled={!canUse || busy} onClick={searchTmdb} className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">ค้นหาจาก TMDB</button>
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Field label="หรือใส่ TMDB ID" value={tmdbId} onChange={setTmdbId} type="number" /></div>
                  <button disabled={!canUse || busy} onClick={loadById} className="mb-0 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white disabled:opacity-50">ดึงข้อมูล</button>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              {searchResults.length ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-xl font-black">ผลลัพธ์</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {searchResults.map((item) => (
                      <button key={item.id} onClick={() => fetchDetails(item.id, mediaType)} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-red-400/60">
                        {posterUrl(item.poster_path) ? <img src={posterUrl(item.poster_path)} alt="" className="h-24 w-16 rounded-xl object-cover" /> : <div className="h-24 w-16 rounded-xl bg-white/10" />}
                        <div>
                          <p className="text-sm font-black text-white">{titleOf(item)}</p>
                          <p className="mt-1 text-xs text-white/45">TMDB {item.id} • {yearOf(item) || '-'} • ⭐ {Number(item.vote_average || 0).toFixed(1)}</p>
                          <p className="mt-2 line-clamp-2 text-xs text-white/35">{item.overview || 'ไม่มีเรื่องย่อ'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black">2. ใส่ลิงก์และเผยแพร่</h2>
                {selected ? (
                  <div className="mt-4 flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-3">
                    {posterUrl(selected.poster_path) ? <img src={posterUrl(selected.poster_path)} alt="" className="h-36 w-24 rounded-xl object-cover" /> : <div className="h-36 w-24 rounded-xl bg-white/10" />}
                    <div>
                      <p className="text-lg font-black">{titleOf(selected)}</p>
                      <p className="mt-1 text-xs text-white/45">TMDB {selected.id} • {yearOf(selected) || '-'} • ⭐ {Number(selected.vote_average || 0).toFixed(1)}</p>
                      <p className="mt-3 line-clamp-4 text-sm text-white/45">{selected.overview || 'ไม่มีเรื่องย่อ'}</p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="ชื่อไทย" value={titleTh} onChange={setTitleTh} />
                  <Field label="ชื่ออังกฤษ" value={titleEn} onChange={setTitleEn} />
                  <Field label="Google Drive / Watch URL" value={watchUrl} onChange={setWatchUrl} placeholder="https://drive.google.com/file/d/.../view" />
                  <Field label="Trailer URL" value={trailerUrl} onChange={setTrailerUrl} placeholder="ไม่ใส่ก็ได้" />
                  <Field label="Provider" value={provider} onChange={setProvider} />
                  <Field label="หมายเหตุ" value={notes} onChange={setNotes} />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button disabled={!canUse || busy} onClick={() => saveLink(true)} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">บันทึกและเผยแพร่</button>
                  <button disabled={!canUse || busy} onClick={() => saveLink(false)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white disabled:opacity-50">บันทึกแบบร่าง</button>
                </div>

                <p className="mt-4 text-xs text-white/35">ถ้าเป็นลิงก์ Google Drive แบบ /view ระบบจะแปลงเป็น /preview ให้อัตโนมัติ</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
