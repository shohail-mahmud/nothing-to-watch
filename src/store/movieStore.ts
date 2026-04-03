import { create } from 'zustand';

const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids: number[];
}

export function getImageUrl(path: string | null, size = 'w200'): string {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  return `${IMG_BASE}/${size}${path}`;
}

interface MovieStore {
  movies: Movie[];
  genres: Record<number, string>;
  selectedMovie: Movie | null;
  isLoading: boolean;
  loadingProgress: number;
  loadedCount: number;
  fetchMovies: (count: number) => void;
  fetchGenres: () => void;
  setSelectedMovie: (movie: Movie | null) => void;
}

export const useMovieStore = create<MovieStore>((set, get) => ({
  movies: [],
  genres: {},
  selectedMovie: null,
  isLoading: false,
  loadingProgress: 0,
  loadedCount: 0,

  fetchGenres: async () => {
    try {
      const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`);
      const data = await res.json();
      const map: Record<number, string> = {};
      for (const g of data.genres) {
        map[g.id] = g.name;
      }
      set({ genres: map });
    } catch (e) {
      console.error('Failed to fetch genres', e);
    }
  },

  fetchMovies: async (count: number) => {
    set({ isLoading: true, loadingProgress: 0, loadedCount: 0 });

    const allMovies: Movie[] = [];
    const moviesPerPage = 20;
    const totalPages = Math.ceil(count / moviesPerPage);
    const seenIds = new Set<number>();

    try {
      // Fetch in batches of 5 concurrent requests
      const batchSize = 5;
      for (let i = 0; i < totalPages; i += batchSize) {
        const pages = [];
        for (let j = i; j < Math.min(i + batchSize, totalPages); j++) {
          pages.push(j + 1);
        }

        const responses = await Promise.all(
          pages.map(page =>
            fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&page=${page}`)
              .then(r => r.json())
              .catch(() => ({ results: [] }))
          )
        );

        for (const data of responses) {
          if (data.results) {
            for (const movie of data.results) {
              if (!seenIds.has(movie.id) && movie.poster_path) {
                seenIds.add(movie.id);
                allMovies.push({
                  id: movie.id,
                  title: movie.title,
                  poster_path: movie.poster_path,
                  vote_average: movie.vote_average,
                  release_date: movie.release_date || '',
                  overview: movie.overview || '',
                  genre_ids: movie.genre_ids || [],
                });
              }
            }
          }
        }

        const progress = Math.min((allMovies.length / count) * 100, 99);
        set({ loadingProgress: progress, loadedCount: allMovies.length });

        if (allMovies.length >= count) break;
      }

      set({
        movies: allMovies.slice(0, count),
        isLoading: false,
        loadingProgress: 100,
        loadedCount: Math.min(allMovies.length, count),
      });
    } catch (e) {
      console.error('Failed to fetch movies', e);
      set({ isLoading: false });
    }
  },

  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
}));
