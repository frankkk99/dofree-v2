import type { MetadataRoute } from 'next';

const siteUrl = 'https://dofree-v2-nine.vercel.app';
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
