import { ExperienceShellAllMoviesRows } from '@/components/ExperienceShellAllMoviesRows';
import { GoogleDriveWatchEnhancer } from '@/components/GoogleDriveWatchEnhancer';
import { LinkReportEnhancer } from '@/components/LinkReportEnhancer';
import { MouseDragCarouselEnhancer } from '@/components/MouseDragCarouselEnhancer';

export default function HomePage() {
  return (
    <main>
      <ExperienceShellAllMoviesRows />
      <MouseDragCarouselEnhancer />
      <GoogleDriveWatchEnhancer />
      <LinkReportEnhancer />
    </main>
  );
}
