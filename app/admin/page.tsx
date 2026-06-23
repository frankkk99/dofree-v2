'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AdminCategory, AdminMovieLink, AdminSection } from '@/types/admin';

type SettingRow = {
  key: string;
  label: string;
  value: Record<string, unknown>;
};

const tabs = [
  { key: 'content', label: 'ข้อความหน้าเว็บ' },
  { key: 'sections', label: 'เปิด/ปิด Section' },
  { key: 'categories', label: 'หมวดหมู่' },
  { key: 'links', label: 'ลิงก์หนัง' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

type LinkForm = {
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  title_th: string;
  watch_url: string;
  trailer_url: string;
  provider: string;
  notes: string;
  is_active: boolean;
};

const emptyLink: LinkForm = {
  tmdb_id: '',
  media_type: 'movie',
  title: '',
  title_th: '',
  watch_url: '',
  trailer_url: '',
  provider: 'Google Drive',
  notes: '',
  is_active: true,
};

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-white/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-red-500/70"
      />
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`h-7 w-12 rounded-full p-1 transition ${checked ? 'bg-red-600' : 'bg-white/15'}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export default function AdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('content');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [links, setLinks] = useState<AdminMovieLink[]>([]);
  const [newLink, setNewLink] = useState<LinkForm>(emptyLink);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    const client = supabase;
    const [settingsRes, sectionsRes, categoriesRes, linksRes] = await Promise.all([
      client.from('site_settings').select('*').order('key'),
      client.from('admin_sections').select('*').order('sort_order'),
      client.from('admin_categories').select('*').order('sort_order'),
      client.from('admin_movie_links').select('*').order('updated_at', { ascending: false }),
    ]);
    setSettings((settingsRes.data || []) as SettingRow[]);
    setSections((sectionsRes.data || []) as AdminSection[]);
    setCategories((categoriesRes.data || []) as AdminCategory[]);
    setLinks((linksRes.data || []) as AdminMovieLink[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;

    async function init() {
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      setSessionEmail(user?.email || null);
      if (user) {
        const profile = await client.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile.data?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
      await loadData();
    }

    init();
    const { data: listener } = client.auth.onAuthStateChange(() => init());
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const login = async () => {
    if (!supabase || !email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setMessage(error ? error.message : 'ส่งลิงก์เข้าสู่ระบบไปที่อีเมลแล้ว');
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSessionEmail(null);
    setIsAdmin(false);
  };

  const updateSettingValue = (key: string, field: string, value: string) => {
    setSettings((current) => current.map((item) => item.key === key ? { ...item, value: { ...item.value, [field]: value } } : item));
  };

  const saveSetting = async (row: SettingRow) => {
    if (!supabase) return;
    const { error } = await supabase.from('site_settings').update({ value: row.value, updated_at: new Date().toISOString() }).eq('key', row.key);
    setMessage(error ? error.message : `บันทึก ${row.label} แล้ว`);
  };

  const saveSection = async (section: AdminSection) => {
    if (!supabase) return;
    const { error } = await supabase.from('admin_sections').update({ enabled: section.enabled, sort_order: section.sort_order, title_th: section.title_th, updated_at: new Date().toISOString() }).eq('key', section.key);
    setMessage(error ? error.message : `บันทึก ${section.title_th} แล้ว`);
  };

  const saveCategory = async (category: AdminCategory) => {
    if (!supabase) return;
    const { error } = await supabase.from('admin_categories').update({
      title_th: category.title_th,
      subtitle_th: category.subtitle_th,
      enabled: category.enabled,
      autoplay: category.autoplay,
      sort_order: category.sort_order,
      pages: category.pages,
      updated_at: new Date().toISOString(),
    }).eq('id', category.id);
    setMessage(error ? error.message : `บันทึก ${category.title_th} แล้ว`);
  };

  const saveLink = async () => {
    if (!supabase || !newLink.tmdb_id) return;
    const payload = {
      tmdb_id: Number(newLink.tmdb_id),
      media_type: newLink.media_type,
      title: newLink.title || null,
      title_th: newLink.title_th || null,
      watch_url: newLink.watch_url || null,
      trailer_url: newLink.trailer_url || null,
      provider: newLink.provider || null,
      notes: newLink.notes || null,
      is_active: Boolean(newLink.is_active),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('admin_movie_links').upsert(payload, { onConflict: 'tmdb_id,media_type' });
    setMessage(error ? error.message : 'บันทึกลิงก์หนังแล้ว');
    if (!error) {
      setNewLink(emptyLink);
      await loadData();
    }
  };

  const updateLinkActive = async (link: AdminMovieLink, active: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('admin_movie_links').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', link.id);
    setMessage(error ? error.message : 'อัปเดตสถานะลิงก์แล้ว');
    if (!error) await loadData();
  };

  if (!supabase) {
    return <main className="min-h-screen bg-black p-6 text-white"><div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">ยังไม่ได้ตั้งค่า Supabase ENV ใน Vercel</div></main>;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300/70">DOFree Admin</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">จัดการหน้าเว็บ</h1>
            <p className="mt-2 text-sm text-white/45">แก้ข้อความ เปิด/ปิดหมวดหมู่ และใส่ลิงก์หนัง</p>
          </div>
          {sessionEmail ? (
            <div className="text-right text-sm text-white/55">
              <p>{sessionEmail}</p>
              <p className={isAdmin ? 'font-bold text-green-300' : 'font-bold text-yellow-300'}>{isAdmin ? 'สิทธิ์ผู้ดูแล' : 'ยังไม่มีสิทธิ์แก้ไข'}</p>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Link href="/admin/dashboard" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">Dashboard</Link>
                <Link href="/admin/quick-add" className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">เพิ่มหนังเร็ว</Link>
                <button onClick={logout} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">ออกจากระบบ</button>
              </div>
            </div>
          ) : null}
        </header>

        {!sessionEmail ? (
          <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-black">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="mt-2 text-sm text-white/45">ใส่อีเมลที่กำหนดเป็น admin ใน Supabase</p>
            <div className="mt-5 space-y-4">
              <Field label="Email" value={email} onChange={setEmail} placeholder="admin@email.com" type="email" />
              <button onClick={login} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">ส่งลิงก์เข้าสู่ระบบ</button>
            </div>
            {message ? <p className="mt-4 text-sm text-red-100/70">{message}</p> : null}
          </section>
        ) : !isAdmin ? (
          <section className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6">
            <h2 className="text-xl font-black text-yellow-100">บัญชีนี้ยังไม่ได้เป็นผู้ดูแล</h2>
            <p className="mt-2 text-sm text-yellow-50/65">ให้ตั้งค่า role เป็น admin ในตาราง profiles ก่อน ถึงจะแก้ไขข้อมูลได้</p>
          </section>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${tab === item.key ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60'}`}>{item.label}</button>)}
            </div>

            {message ? <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">{message}</div> : null}
            {loading ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">กำลังโหลดข้อมูล...</div> : null}

            {tab === 'content' ? <section className="grid gap-4 md:grid-cols-2">
              {settings.map((row) => <div key={row.key} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-lg font-black">{row.label}</h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(row.value || {}).map(([field, value]) => <Field key={field} label={field} value={String(value || '')} onChange={(next) => updateSettingValue(row.key, field, next)} />)}
                </div>
                <button onClick={() => saveSetting(row)} className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">บันทึก</button>
              </div>)}
            </section> : null}

            {tab === 'sections' ? <section className="space-y-3">
              {sections.map((section) => <div key={section.key} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_120px_80px_auto] md:items-center">
                <Field label="ชื่อ Section" value={section.title_th} onChange={(value) => setSections((current) => current.map((item) => item.key === section.key ? { ...item, title_th: value } : item))} />
                <Field label="ลำดับ" type="number" value={section.sort_order} onChange={(value) => setSections((current) => current.map((item) => item.key === section.key ? { ...item, sort_order: Number(value) } : item))} />
                <div><span className="text-xs font-bold text-white/45">เปิด</span><div className="mt-2"><Toggle checked={section.enabled} onChange={(value) => setSections((current) => current.map((item) => item.key === section.key ? { ...item, enabled: value } : item))} /></div></div>
                <button onClick={() => saveSection(section)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">บันทึก</button>
              </div>)}
            </section> : null}

            {tab === 'categories' ? <section className="space-y-3">
              {categories.map((category) => <div key={category.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_1fr_90px_80px_80px_auto] md:items-center">
                <Field label="ชื่อหมวด" value={category.title_th} onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, title_th: value } : item))} />
                <Field label="คำอธิบาย" value={category.subtitle_th || ''} onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, subtitle_th: value } : item))} />
                <Field label="ลำดับ" type="number" value={category.sort_order} onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, sort_order: Number(value) } : item))} />
                <div><span className="text-xs font-bold text-white/45">เปิด</span><div className="mt-2"><Toggle checked={category.enabled} onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, enabled: value } : item))} /></div></div>
                <div><span className="text-xs font-bold text-white/45">เลื่อน</span><div className="mt-2"><Toggle checked={category.autoplay} onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, autoplay: value } : item))} /></div></div>
                <button onClick={() => saveCategory(category)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">บันทึก</button>
              </div>)}
            </section> : null}

            {tab === 'links' ? <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-lg font-black">เพิ่ม / แก้ลิงก์หนัง</h3>
                <div className="mt-4 space-y-3">
                  <Field label="TMDB ID" value={newLink.tmdb_id} onChange={(value) => setNewLink({ ...newLink, tmdb_id: value })} type="number" />
                  <label className="block"><span className="text-xs font-bold text-white/45">ประเภท</span><select value={newLink.media_type} onChange={(event) => setNewLink({ ...newLink, media_type: event.target.value as 'movie' | 'tv' })} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white"><option value="movie">movie</option><option value="tv">tv</option></select></label>
                  <Field label="ชื่ออังกฤษ" value={newLink.title} onChange={(value) => setNewLink({ ...newLink, title: value })} />
                  <Field label="ชื่อไทย" value={newLink.title_th} onChange={(value) => setNewLink({ ...newLink, title_th: value })} />
                  <Field label="ลิงก์หนัง / Google Drive" value={newLink.watch_url} onChange={(value) => setNewLink({ ...newLink, watch_url: value })} placeholder="https://drive.google.com/file/d/..." />
                  <Field label="ลิงก์ Trailer" value={newLink.trailer_url} onChange={(value) => setNewLink({ ...newLink, trailer_url: value })} placeholder="https://..." />
                  <Field label="แหล่งที่มา / Provider" value={newLink.provider} onChange={(value) => setNewLink({ ...newLink, provider: value })} />
                  <Field label="หมายเหตุ" value={newLink.notes} onChange={(value) => setNewLink({ ...newLink, notes: value })} />
                  <div><span className="text-xs font-bold text-white/45">เปิดใช้งาน</span><div className="mt-2"><Toggle checked={newLink.is_active} onChange={(value) => setNewLink({ ...newLink, is_active: value })} /></div></div>
                  <button onClick={saveLink} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">บันทึกลิงก์</button>
                </div>
              </div>

              <div className="space-y-3">
                {links.map((link) => <div key={link.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{link.title_th || link.title || `${link.media_type}-${link.tmdb_id}`}</p>
                      <p className="mt-1 text-xs text-white/40">{link.media_type} • TMDB {link.tmdb_id}</p>
                      {link.watch_url ? <p className="mt-2 break-all text-xs text-green-200/70">{link.watch_url}</p> : null}
                    </div>
                    <Toggle checked={link.is_active} onChange={(value) => updateLinkActive(link, value)} />
                  </div>
                </div>)}
              </div>
            </section> : null}
          </>
        )}
      </div>
    </main>
  );
}
