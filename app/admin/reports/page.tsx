'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LinkReport = {
  id: string;
  tmdb_id: number | null;
  media_type: 'movie' | 'tv';
  title: string | null;
  title_th: string | null;
  url: string | null;
  reason: string;
  detail: string | null;
  status: 'pending' | 'fixed' | 'ignored';
  created_at: string;
};

const statusLabel: Record<LinkReport['status'], string> = {
  pending: 'รอตรวจ',
  fixed: 'แก้แล้ว',
  ignored: 'ไม่ดำเนินการ',
};

export default function AdminReportsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<LinkReport[]>([]);
  const [message, setMessage] = useState('');

  async function loadReports() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('link_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    setReports((data || []) as LinkReport[]);
    if (error) setMessage(error.message);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function init() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setEmail(user?.email || null);

      if (user) {
        const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const admin = profile.data?.role === 'admin';
        setIsAdmin(admin);
        if (admin) await loadReports();
      }
      setLoading(false);
    }

    init();
  }, [supabase]);

  async function updateStatus(report: LinkReport, status: LinkReport['status']) {
    if (!supabase) return;
    const { error } = await supabase
      .from('link_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', report.id);

    setMessage(error ? error.message : `อัปเดตเป็น ${statusLabel[status]} แล้ว`);
    if (!error) await loadReports();
  }

  if (!supabase) {
    return <main className="min-h-screen bg-black p-6 text-white">ยังไม่ได้ตั้งค่า Supabase ENV ใน Vercel</main>;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <a href="/admin" className="text-xs font-bold text-red-200/70 hover:text-red-100">← กลับหน้า Admin</a>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">รายงานลิงก์เสีย</h1>
          <p className="mt-2 text-sm text-white/45">ดูรายการที่ผู้ใช้แจ้งว่าเปิดไม่ได้หรือมีปัญหา</p>
          {email ? <p className="mt-3 text-xs text-white/35">{email}</p> : null}
        </header>

        {loading ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">กำลังโหลด...</div> : null}
        {!loading && !email ? <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50/80">กรุณาเข้าสู่ระบบที่หน้า Admin ก่อน</div> : null}
        {!loading && email && !isAdmin ? <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50/80">บัญชีนี้ยังไม่มีสิทธิ์ผู้ดูแล</div> : null}
        {message ? <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">{message}</div> : null}

        {isAdmin ? (
          <section className="space-y-3">
            {!reports.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/50">ยังไม่มีรายงานลิงก์เสีย</div> : null}
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${report.status === 'pending' ? 'bg-yellow-300/15 text-yellow-100' : report.status === 'fixed' ? 'bg-green-400/15 text-green-100' : 'bg-white/10 text-white/55'}`}>{statusLabel[report.status]}</span>
                      <span className="text-xs text-white/35">{new Date(report.created_at).toLocaleString('th-TH')}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-black text-white">{report.title_th || report.title || `${report.media_type}-${report.tmdb_id || 'unknown'}`}</h2>
                    <p className="mt-1 text-xs text-white/45">{report.media_type} {report.tmdb_id ? `• TMDB ${report.tmdb_id}` : ''}</p>
                    <p className="mt-3 text-sm font-bold text-red-100/80">เหตุผล: {report.reason}</p>
                    {report.detail ? <p className="mt-2 text-sm text-white/55">{report.detail}</p> : null}
                    {report.url ? <p className="mt-3 break-all text-xs text-green-200/70">{report.url}</p> : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button onClick={() => updateStatus(report, 'fixed')} className="rounded-xl bg-green-500/20 px-4 py-2 text-xs font-black text-green-100 hover:bg-green-500/30">แก้แล้ว</button>
                    <button onClick={() => updateStatus(report, 'ignored')} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/20">ไม่ดำเนินการ</button>
                    <button onClick={() => updateStatus(report, 'pending')} className="rounded-xl bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100 hover:bg-yellow-300/20">รอตรวจ</button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
