'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type MovieLink = {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string | null;
  title_th: string | null;
  watch_url: string | null;
  provider: string | null;
  is_active: boolean;
  updated_at: string | null;
};

type LinkReport = {
  id: string;
  tmdb_id: number | null;
  media_type: string | null;
  movie_title: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
};

type Summary = {
  totalLinks: number;
  activeLinks: number;
  draftLinks: number;
  watchReady: number;
  categoriesEnabled: number;
  sectionsEnabled: number;
  pendingReports: number;
};

const initialSummary: Summary = {
  totalLinks: 0,
  activeLinks: 0,
  draftLinks: 0,
  watchReady: 0,
  categoriesEnabled: 0,
  sectionsEnabled: 0,
  pendingReports: 0,
};

function StatCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-white/45">{hint}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-5 transition hover:border-red-400/40 hover:bg-red-500/10">
      <p className="text-lg font-black text-white transition group-hover:text-red-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/45">{desc}</p>
    </Link>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [recentLinks, setRecentLinks] = useState<MovieLink[]>([]);
  const [recentReports, setRecentReports] = useState<LinkReport[]>([]);

  const loadDashboard = async () => {
    if (!supabase) return;
    setLoading(true);

    const [linksRes, reportsRes, categoriesRes, sectionsRes] = await Promise.all([
      supabase
        .from('admin_movie_links')
        .select('id, tmdb_id, media_type, title, title_th, watch_url, provider, is_active, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('link_reports')
        .select('id, tmdb_id, media_type, movie_title, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('admin_categories').select('id, enabled'),
      supabase.from('admin_sections').select('key, enabled'),
    ]);

    const links = (linksRes.data || []) as MovieLink[];
    const reports = (reportsRes.data || []) as LinkReport[];
    const categories = categoriesRes.data || [];
    const sections = sectionsRes.data || [];

    setSummary({
      totalLinks: links.length,
      activeLinks: links.filter((item) => item.is_active).length,
      draftLinks: links.filter((item) => !item.is_active).length,
      watchReady: links.filter((item) => item.is_active && item.watch_url).length,
      categoriesEnabled: categories.filter((item: any) => item.enabled).length,
      sectionsEnabled: sections.filter((item: any) => item.enabled).length,
      pendingReports: reports.filter((item) => (item.status || 'pending') === 'pending').length,
    });

    setRecentLinks(links.slice(0, 8));
    setRecentReports(reports);
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function init() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setSessionEmail(user?.email || null);
      if (user) {
        const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile.data?.role === 'admin');
      }
      await loadDashboard();
    }

    init();
    const { data: listener } = supabase.auth.onAuthStateChange(() => init());
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const login = async () => {
    if (!supabase || !email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/dashboard` },
    });
    setMessage(error ? error.message : 'ส่งลิงก์เข้าสู่ระบบไปที่อีเมลแล้ว');
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setSessionEmail(null);
    setIsAdmin(false);
  };

  if (!supabase) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">ยังไม่ได้ตั้งค่า Supabase ENV ใน Vercel</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,.18),rgba(255,255,255,.04)_40%,rgba(255,255,255,.02))] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-red-300/70">DOFree Admin</p>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">ภาพรวมหลังบ้าน</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">ดูสถานะหมวด หนังที่เพิ่มไว้ รายงานที่ต้องตรวจ และปุ่มลัดสำหรับจัดการเว็บ</p>
          </div>
          {sessionEmail ? (
            <div className="text-left text-sm text-white/55 md:text-right">
              <p>{sessionEmail}</p>
              <p className={isAdmin ? 'font-bold text-green-300' : 'font-bold text-yellow-300'}>{isAdmin ? 'สิทธิ์ผู้ดูแล' : 'ยังไม่มีสิทธิ์แก้ไข'}</p>
              <button onClick={logout} className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">ออกจากระบบ</button>
            </div>
          ) : null}
        </header>

        {!sessionEmail ? (
          <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-black">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="mt-2 text-sm text-white/45">ใส่อีเมลที่กำหนดเป็น admin ใน Supabase</p>
            <div className="mt-5 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-white outline-none focus:border-red-500/70"
              />
              <button onClick={login} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">ส่งลิงก์เข้าสู่ระบบ</button>
            </div>
            {message ? <p className="mt-4 text-sm text-red-100/70">{message}</p> : null}
          </section>
        ) : !isAdmin ? (
          <section className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6">
            <h2 className="text-xl font-black text-yellow-100">บัญชีนี้ยังไม่ได้เป็นผู้ดูแล</h2>
            <p className="mt-2 text-sm text-yellow-50/65">ให้ตั้งค่า role เป็น admin ในตาราง profiles ก่อน ถึงจะดู dashboard และแก้ไขข้อมูลได้</p>
          </section>
        ) : (
          <>
            <nav className="mb-6 flex flex-wrap gap-2">
              <Link href="/admin/dashboard" className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white">ภาพรวม</Link>
              <Link href="/admin/quick-add" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/15">เพิ่มหนังเร็ว</Link>
              <Link href="/admin/reports" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/15">รายงานลิงก์เสีย</Link>
              <Link href="/admin" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/15">ตั้งค่าเว็บ</Link>
              <Link href="/" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/15">กลับหน้าเว็บ</Link>
            </nav>

            {loading ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">กำลังโหลดข้อมูล...</div> : null}

            {!loading ? (
              <>
                <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <StatCard label="ดูได้แล้ว" value={summary.watchReady} hint="เปิดใช้งานและมีลิงก์" />
                  <StatCard label="ลิงก์ทั้งหมด" value={summary.totalLinks} hint="รายการที่แอดมินเพิ่ม" />
                  <StatCard label="เปิดใช้งาน" value={summary.activeLinks} hint="กำลังเผยแพร่" />
                  <StatCard label="แบบร่าง/ปิด" value={summary.draftLinks} hint="ยังไม่โชว์หน้าเว็บ" />
                  <StatCard label="หมวดที่เปิด" value={summary.categoriesEnabled} hint="หมวดบนหน้าแรก" />
                  <StatCard label="รอตรวจ" value={summary.pendingReports} hint="รายงานลิงก์เสีย" />
                </section>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                  <QuickLink href="/admin/quick-add" title="เพิ่มหนังแบบเร็ว" desc="ค้นหาจาก TMDB ใส่ลิงก์ แล้วเผยแพร่ได้ทันที" />
                  <QuickLink href="/admin/reports" title="ตรวจรายงานลิงก์เสีย" desc="ดูรายการแจ้งปัญหาและเปลี่ยนสถานะหลังแก้ไข" />
                  <QuickLink href="/admin" title="ตั้งค่าเว็บ" desc="แก้ข้อความ หมวดหมู่ section และรายการลิงก์เดิม" />
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-black">หนังเพิ่มล่าสุด</h2>
                      <Link href="/admin/quick-add" className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/15">เพิ่มใหม่</Link>
                    </div>
                    <div className="mt-4 space-y-3">
                      {recentLinks.length ? recentLinks.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-white">{item.title_th || item.title || `TMDB ${item.tmdb_id}`}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{item.media_type} · TMDB {item.tmdb_id}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${item.is_active ? 'bg-green-400/15 text-green-200' : 'bg-yellow-400/15 text-yellow-100'}`}>
                              {item.is_active ? 'เผยแพร่' : 'ร่าง'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/35">{item.provider || 'ไม่ระบุ'} · {formatDate(item.updated_at)}</p>
                        </div>
                      )) : <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">ยังไม่มีรายการหนังที่แอดมินเพิ่ม</p>}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-black">รายงานล่าสุด</h2>
                      <Link href="/admin/reports" className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/15">ดูทั้งหมด</Link>
                    </div>
                    <div className="mt-4 space-y-3">
                      {recentReports.length ? recentReports.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-white">{item.movie_title || `TMDB ${item.tmdb_id || '-'}`}</p>
                              <p className="mt-1 text-sm text-white/45">{item.reason || 'ไม่ระบุเหตุผล'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${(item.status || 'pending') === 'pending' ? 'bg-red-400/15 text-red-100' : 'bg-green-400/15 text-green-200'}`}>
                              {(item.status || 'pending') === 'pending' ? 'รอตรวจ' : item.status}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/35">{item.media_type || '-'} · {formatDate(item.created_at)}</p>
                        </div>
                      )) : <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">ยังไม่มีรายงานลิงก์เสีย</p>}
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
