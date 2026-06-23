import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const allowedReasons = new Set([
  'เปิดไม่ได้',
  'ไฟล์ถูกลบ',
  'ไม่มีสิทธิ์เข้าถึง',
  'เสียง/ภาพมีปัญหา',
  'ลิงก์ผิดเรื่อง',
  'อื่น ๆ',
]);

function cleanText(value: unknown, max = 500) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

function cleanMediaType(value: unknown) {
  return value === 'tv' ? 'tv' : 'movie';
}

function cleanNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า Supabase' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const reason = cleanText(body.reason, 80) || 'เปิดไม่ได้';
    const payload = {
      tmdb_id: cleanNumber(body.tmdbId),
      media_type: cleanMediaType(body.mediaType),
      title: cleanText(body.title, 220),
      title_th: cleanText(body.titleTh, 220),
      url: cleanText(body.url, 1200),
      reason: allowedReasons.has(reason) ? reason : 'อื่น ๆ',
      detail: cleanText(body.detail, 1000),
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/link_reports`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || 'บันทึกแจ้งลิงก์เสียไม่สำเร็จ' }, { status: response.status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }
}
