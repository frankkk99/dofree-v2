import { ExperienceShellAllMoviesRows } from '@/components/ExperienceShellAllMoviesRows';
import { MouseDragCarouselEnhancer } from '@/components/MouseDragCarouselEnhancer';

export default function HomePage() {
  return (
    <main>
      <ExperienceShellAllMoviesRows />
      <MouseDragCarouselEnhancer />
    </main>
  );
}
