import { ExperienceShellAllMoviesRows } from '@/components/ExperienceShellAllMoviesRows';
import { GoogleDriveWatchEnhancer } from '@/components/GoogleDriveWatchEnhancer';
import { MouseDragCarouselEnhancer } from '@/components/MouseDragCarouselEnhancer';

export default function HomePage() {
  return (
    <main>
      <ExperienceShellAllMoviesRows />
      <MouseDragCarouselEnhancer />
      <GoogleDriveWatchEnhancer />
    </main>
  );
}
