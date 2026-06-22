import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOFree v2 | Movie Discovery Portfolio',
  description: 'A cinematic movie discovery web app built with Next.js, TypeScript, and Tailwind CSS.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
