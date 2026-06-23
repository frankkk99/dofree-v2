import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DOFree By Frank - ดูหนัง ซีรีส์ และข้อมูลภาพยนตร์';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'radial-gradient(circle at 20% 20%, #7f1d1d 0, #111827 34%, #020617 100%)',
          color: 'white',
          padding: 72,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f87171' }}>DOFree By Frank</div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>TH / EN Movie Discovery</div>
        </div>
        <div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.05em', maxWidth: 900 }}>
            ดูหนัง ซีรีส์ และข้อมูลภาพยนตร์
          </div>
          <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.35, color: 'rgba(255,255,255,0.74)', maxWidth: 920 }}>
            ค้นหาชื่อไทย อังกฤษ เรื่องย่อ นักแสดง ตัวอย่างหนัง และหมวดหมู่ที่จัดการได้ผ่านระบบ Admin
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 24, color: 'rgba(255,255,255,0.72)' }}>
          <span>หนังไทย</span>
          <span>•</span>
          <span>หนังฝรั่ง</span>
          <span>•</span>
          <span>กำลังฉาย</span>
          <span>•</span>
          <span>ยอดนิยม</span>
        </div>
      </div>
    ),
    size,
  );
}
