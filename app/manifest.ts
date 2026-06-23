import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DOFree By Frank',
    short_name: 'DOFree',
    description: 'เว็บรวมข้อมูลหนังและซีรีส์ พร้อมชื่อไทย อังกฤษ เรื่องย่อ นักแสดง ตัวอย่างหนัง และลิงก์รับชม',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#dc2626',
    orientation: 'portrait-primary',
    lang: 'th-TH',
    categories: ['entertainment', 'movies', 'tv'],
  };
}
