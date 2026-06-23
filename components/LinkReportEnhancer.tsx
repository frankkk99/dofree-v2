'use client';

import { useEffect } from 'react';

const reportReasons = [
  'เปิดไม่ได้',
  'ไฟล์ถูกลบ',
  'ไม่มีสิทธิ์เข้าถึง',
  'เสียง/ภาพมีปัญหา',
  'ลิงก์ผิดเรื่อง',
  'อื่น ๆ',
];

function getMovieTitle(root: HTMLElement) {
  const title = root.querySelector('h2')?.textContent?.trim();
  return title || document.querySelector('h1')?.textContent?.trim() || null;
}

function parsePlayerHref(href: string) {
  const match = href.match(/\/player\/(movie|tv)\/(\d+)/);
  if (!match) return { mediaType: 'movie', tmdbId: null };
  return { mediaType: match[1], tmdbId: Number(match[2]) };
}

function ensureReportButton() {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/player/"], a[href*="drive.google.com"]'));

  anchors.forEach((anchor) => {
    const parent = anchor.parentElement;
    if (!parent || parent.querySelector('[data-link-report-button="true"]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.linkReportButton = 'true';
    button.className = 'rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-5 py-3 text-sm font-black text-yellow-100 hover:bg-yellow-300/20';
    button.textContent = 'แจ้งลิงก์เสีย';

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const modal = anchor.closest('div[class*="fixed"]') as HTMLElement | null;
      const root = modal || document.body;
      const reason = window.prompt(`แจ้งปัญหาลิงก์\n\nเลือก/พิมพ์เหตุผล:\n${reportReasons.join('\n')}`, 'เปิดไม่ได้');
      if (!reason) return;

      const detail = window.prompt('รายละเอียดเพิ่มเติม ถ้าไม่มีให้เว้นว่าง', '') || '';
      const href = anchor.getAttribute('href') || '';
      const parsed = parsePlayerHref(href);

      button.textContent = 'กำลังส่ง...';
      button.disabled = true;

      try {
        const response = await fetch('/api/link-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdbId: parsed.tmdbId,
            mediaType: parsed.mediaType,
            title: getMovieTitle(root),
            titleTh: null,
            url: href,
            reason,
            detail,
          }),
        });

        if (!response.ok) throw new Error('report failed');
        button.textContent = 'แจ้งแล้ว';
        window.setTimeout(() => { button.textContent = 'แจ้งลิงก์เสีย'; button.disabled = false; }, 2000);
      } catch {
        button.textContent = 'ส่งไม่สำเร็จ';
        window.setTimeout(() => { button.textContent = 'แจ้งลิงก์เสีย'; button.disabled = false; }, 2000);
      }
    });

    parent.appendChild(button);
  });
}

export function LinkReportEnhancer() {
  useEffect(() => {
    ensureReportButton();
    const observer = new MutationObserver(() => ensureReportButton());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
