'use client';

import { useEffect } from 'react';

function isExternalWatchUrl(href: string) {
  return href.startsWith('http') && !href.includes('/player/');
}

function isGoogleDriveUrl(href: string) {
  return href.includes('drive.google.com') || href.includes('docs.google.com');
}

function normalizeGoogleDriveUrl(href: string) {
  try {
    const url = new URL(href);
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    const idFromQuery = url.searchParams.get('id');
    const fileId = fileMatch?.[1] || idFromQuery;
    if (!fileId || !isGoogleDriveUrl(href)) return href;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch {
    return href;
  }
}

export function GoogleDriveWatchEnhancer() {
  useEffect(() => {
    const enhanceLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        const href = link.href;
        const text = link.textContent?.trim() || '';
        if (text === 'เปิด Player') link.textContent = isExternalWatchUrl(href) ? 'รับชมหนัง' : 'เปิดตัวอย่าง';
        if (isExternalWatchUrl(href)) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          if (isGoogleDriveUrl(href)) {
            link.href = normalizeGoogleDriveUrl(href);
            link.setAttribute('data-provider', 'google-drive');
          }
        }
      });
    };

    const openExternalWatchLink = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const label = button.textContent || '';
      if (!label.includes('รับชม')) return;

      const modal = button.closest('.fixed') || button.closest('section') || document;
      const externalLink = Array.from(modal.querySelectorAll<HTMLAnchorElement>('a[href]')).find((link) => isExternalWatchUrl(link.href));
      if (!externalLink) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const href = isGoogleDriveUrl(externalLink.href) ? normalizeGoogleDriveUrl(externalLink.href) : externalLink.href;
      window.open(href, '_blank', 'noopener,noreferrer');
    };

    enhanceLinks();
    const observer = new MutationObserver(enhanceLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', openExternalWatchLink, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', openExternalWatchLink, true);
    };
  }, []);

  return null;
}
