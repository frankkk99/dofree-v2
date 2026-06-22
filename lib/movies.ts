import type { Movie } from '@/types/movie';

export const featuredMovie: Movie = {
  id: 1,
  title: 'Dune: Part Two',
  thaiTitle: 'ดูน ภาคสอง',
  year: '2024',
  rating: '8.5',
  genres: ['Sci-Fi', 'Adventure', 'Drama'],
  overview:
    'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
  poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  trailerUrl: 'https://www.youtube.com/results?search_query=Dune+Part+Two+official+trailer',
};

export const movies: Movie[] = [
  featuredMovie,
  {
    id: 2,
    title: 'Inside Out 2',
    thaiTitle: 'มหัศจรรย์อารมณ์อลเวง 2',
    year: '2024',
    rating: '7.6',
    genres: ['Animation', 'Family', 'Comedy'],
    overview: 'Riley enters her teenage years as new emotions arrive and shake up headquarters.',
    poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg',
  },
  {
    id: 3,
    title: 'Furiosa: A Mad Max Saga',
    thaiTitle: 'ฟูริโอซ่า มหากาพย์แมดแม็กซ์',
    year: '2024',
    rating: '7.5',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    overview: 'The origin story of renegade warrior Furiosa before her encounter with Mad Max.',
    poster: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
  },
  {
    id: 4,
    title: 'Godzilla x Kong: The New Empire',
    thaiTitle: 'ก็อดซิลล่า ปะทะ คอง อาณาจักรใหม่',
    year: '2024',
    rating: '7.1',
    genres: ['Action', 'Adventure', 'Fantasy'],
    overview: 'Two ancient titans rise again as a hidden threat challenges the balance of the world.',
    poster: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg',
  },
  {
    id: 5,
    title: 'Kingdom of the Planet of the Apes',
    thaiTitle: 'อาณาจักรแห่งพิภพวานร',
    year: '2024',
    rating: '7.2',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    overview: 'Many years after Caesar, a young ape begins a journey that will define the future.',
    poster: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fDmci71SMkfZM8RnCuXJVDPaSdE.jpg',
  },
  {
    id: 6,
    title: 'Civil War',
    thaiTitle: 'วิบัติสมรภูมิเมืองเดือด',
    year: '2024',
    rating: '6.9',
    genres: ['Drama', 'Action', 'War'],
    overview: 'A team of journalists travels across a fractured nation during a near-future conflict.',
    poster: 'https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/z121dSTR7PY9KxKuvwiIFSYW8cf.jpg',
  },
];

export const movieRows = [
  {
    title: 'Trending Now',
    subtitle: 'Curated picks for a cinematic browsing experience',
    movies,
  },
  {
    title: 'Action & Adventure',
    subtitle: 'High-energy stories with bold visual worlds',
    movies: movies.filter((movie) => movie.genres.some((genre) => ['Action', 'Adventure'].includes(genre))),
  },
  {
    title: 'Family & Animation',
    subtitle: 'Bright, accessible titles for every screen size',
    movies: movies.filter((movie) => movie.genres.some((genre) => ['Animation', 'Family'].includes(genre))),
  },
];
