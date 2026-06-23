import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const siteUrl = 'https://dofree-v2-nine.vercel.app';
const siteName = 'DOFree By Frank';
const siteDescription = 'เว็บรวมข้อมูลหนังและซีรีส์ พร้อมชื่อไทย อังกฤษ เรื่องย่อ นักแสดง ตัวอย่างหนัง หมวดหมู่ และลิงก์รับชมที่จัดการได้ผ่านระบบ Admin';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} | ดูหนัง ซีรีส์ และข้อมูลภาพยนตร์ ไทย/อังกฤษ`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'ดูหนัง',
    'หนังออนไลน์',
    'ซีรีส์',
    'รีวิวหนัง',
    'ตัวอย่างหนัง',
    'หนังไทย',
    'หนังฝรั่ง',
    'หนังใหม่',
    'DOFree',
    'DOFree By Frank',
  ],
  authors: [{ name: 'Frank', url: siteUrl }],
  creator: 'Frank',
  publisher: 'DOFree By Frank',
  category: 'entertainment',
  alternates: {
    canonical: '/',
    languages: {
      'th-TH': '/',
      'en-US': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    alternateLocale: ['en_US'],
    url: siteUrl,
    siteName,
    title: `${siteName} | ดูหนัง ซีรีส์ และข้อมูลภาพยนตร์`,
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${siteName} - Movie Discovery`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | ดูหนัง ซีรีส์ และข้อมูลภาพยนตร์`,
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  alternateName: ['DOFree', 'DOFree v2', 'DOFree By Frank'],
  url: siteUrl,
  inLanguage: 'th-TH',
  description: siteDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th-TH">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  );
}
