export type MediaType = 'movie' | 'tv';

export type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile?: string;
};

export type Movie = {
  id: number;
  mediaType: MediaType;
  title: string;
  thaiTitle?: string;
  year: string;
  rating: string;
  genres: string[];
  thaiGenres?: string[];
  overview: string;
  thaiOverview?: string;
  poster: string;
  backdrop: string;
  trailerKey?: string;
  trailerUrl?: string;
  watchUrl?: string;
  provider?: string;
  runtime?: string;
  cast?: CastMember[];
};

export type MovieRowData = {
  title: string;
  subtitle: string;
  movies: Movie[];
  slug?: string;
  autoplay?: boolean;
  loadedPages?: number;
  hasMore?: boolean;
};
