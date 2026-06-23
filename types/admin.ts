export type SiteSettings = {
  brand?: {
    siteName?: string;
    tagline?: string;
  };
  hero?: {
    primaryButton?: string;
    secondaryButton?: string;
    loadingText?: string;
    fallbackText?: string;
  };
  navigation?: {
    movies?: string;
    categories?: string;
    portfolio?: string;
  };
  premium?: {
    title?: string;
    body?: string;
  };
};

export type AdminCategory = {
  id: string;
  slug: string;
  title_th: string;
  subtitle_th: string | null;
  tmdb_path: string;
  media_type: 'movie' | 'tv';
  tmdb_params: Record<string, string>;
  pages: number;
  enabled: boolean;
  autoplay: boolean;
  sort_order: number;
};

export type AdminSection = {
  key: string;
  title_th: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  settings: Record<string, unknown>;
};

export type AdminMovieLink = {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string | null;
  title_th: string | null;
  watch_url: string | null;
  trailer_url: string | null;
  provider: string | null;
  is_active: boolean;
  notes: string | null;
};
