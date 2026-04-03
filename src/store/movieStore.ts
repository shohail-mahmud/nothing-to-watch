import { create } from 'zustand';

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids: number[];
}

const genreMap: Record<number, string> = {
  28: 'Action',
  35: 'Comedy',
  18: 'Drama',
  27: 'Horror',
  878: 'Sci-Fi',
  10749: 'Romance',
  53: 'Thriller',
  16: 'Animation',
  99: 'Documentary',
  12: 'Adventure',
};

const genreIds = Object.keys(genreMap).map(Number);

const movieTitles = [
  'The Last Horizon', 'Midnight Echo', 'Starfall', 'The Silent Path',
  'Crimson Dawn', 'Echoes of Tomorrow', 'The Forgotten Kingdom', 'Neon Dreams',
  'Shadow Protocol', 'Beyond the Storm', 'Celestial', 'The Deep End',
  'Iron Will', 'Phantom Divide', 'Solar Winds', 'The Artisan',
  'Rogue Element', 'Emerald City', 'The Lighthouse', 'Velocity',
  'Obsidian', 'The Wanderer', 'Cascade', 'Dark Matter',
  'The Alchemist', 'Zero Hour', 'Northern Lights', 'The Catalyst',
  'Wildfire', 'The Oracle', 'Quantum', 'Silver Lining',
  'The Architect', 'Phoenix Rising', 'Gravity Falls', 'The Messenger',
  'Apex', 'The Conductor', 'Parallax', 'Storm Chaser',
  'The Gambit', 'Meridian', 'Afterglow', 'The Pioneer',
  'Fracture', 'The Sentinel', 'Aurora', 'Crossfire',
  'The Dreamer', 'Sovereign', 'Nightfall', 'The Advocate',
  'Pulsar', 'The Navigator', 'Synthesis', 'Breaking Point',
  'The Visionary', 'Equinox', 'Thunder Road', 'The Guardian',
  'Kaleidoscope', 'The Reckoning', 'Stargazer', 'Lost Signal',
  'The Prodigy', 'Eclipse', 'Undertow', 'The Inventor',
  'Supernova', 'The Outsider', 'Altitude', 'Silent Running',
  'The Heist', 'Vanguard', 'Shattered', 'The Collector',
  'Radiance', 'The Ronin', 'Wavelength', 'Terminal',
  'The Fixer', 'Odyssey', 'Blackout', 'The Virtuoso',
  'Resonance', 'The Witness', 'Frontier', 'Avalanche',
  'The Conspirator', 'Nebula', 'The Handler', 'Momentum',
  'The Operative', 'Spectrum', 'Refuge', 'The Infiltrator',
  'Cascade Effect', 'The Informant', 'Vector', 'Safe Harbor',
];

const overviews = [
  'A gripping tale of survival and redemption in a world on the brink.',
  'When secrets surface, one person must uncover the truth before it\'s too late.',
  'An epic journey across time and space that challenges everything we know.',
  'Love and loss collide in this heartfelt story of human connection.',
  'In a race against time, heroes must rise to face an impossible threat.',
  'A masterful exploration of what it means to be human in a digital age.',
  'Friendship is tested when an unexpected discovery changes everything.',
  'One choice can change the course of history in this thrilling adventure.',
  'A visually stunning odyssey through uncharted territories of imagination.',
  'When all hope seems lost, courage emerges from the most unlikely place.',
];

const colorPalettes = [
  ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
  ['#2d132c', '#801336', '#c72c41', '#ee4540'],
  ['#1b262c', '#0f4c75', '#3282b8', '#bbe1fa'],
  ['#0d0d0d', '#1a1a1a', '#2d2d2d', '#ff6b35'],
  ['#1f1f1f', '#2e2e2e', '#3d3d3d', '#00d9ff'],
  ['#0a1628', '#1c3144', '#3a506b', '#5bc0be'],
  ['#2b2024', '#4a3728', '#6b4423', '#ffc857'],
  ['#1a1a2e', '#0f3460', '#533483', '#e94560'],
  ['#0b132b', '#1c2541', '#3a506b', '#5bc0be'],
  ['#10002b', '#240046', '#3c096c', '#7b2cbf'],
];

function generatePosterSvg(index: number, title: string, year: number): string {
  const palette = colorPalettes[index % colorPalettes.length];
  const displayTitle = title.substring(0, 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><defs><linearGradient id="bg${index}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${palette[0]}"/><stop offset="50%" style="stop-color:${palette[1]}"/><stop offset="100%" style="stop-color:${palette[2]}"/></linearGradient></defs><rect width="300" height="450" fill="url(#bg${index})"/><circle cx="${100 + (index % 5) * 20}" cy="${150 + (index % 3) * 30}" r="${50 + (index % 4) * 10}" fill="${palette[3]}" opacity="0.3"/><circle cx="${200 - (index % 4) * 15}" cy="${300 + (index % 5) * 20}" r="${30 + (index % 3) * 15}" fill="${palette[3]}" opacity="0.2"/><text x="150" y="380" text-anchor="middle" fill="white" font-family="system-ui" font-size="14" font-weight="bold" opacity="0.9">${displayTitle}</text><text x="150" y="410" text-anchor="middle" fill="${palette[3]}" font-family="system-ui" font-size="12">${year}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateMovies(count: number): Movie[] {
  const movies: Movie[] = [];
  for (let i = 0; i < count; i++) {
    const titleIndex = i % movieTitles.length;
    const title = `${movieTitles[titleIndex]}${i >= movieTitles.length ? ` ${Math.floor(i / movieTitles.length) + 1}` : ''}`;
    const year = 2010 + (i % 16);
    const gCount = 1 + Math.floor(Math.random() * 2);
    const gIds: number[] = [];
    for (let g = 0; g < gCount; g++) {
      gIds.push(genreIds[Math.floor(Math.random() * genreIds.length)]);
    }
    movies.push({
      id: i + 1,
      title,
      poster_path: generatePosterSvg(i, title, year),
      vote_average: Math.round((6 + Math.random() * 4) * 10) / 10,
      release_date: `${year}-${String(1 + (i % 12)).padStart(2, '0')}-15`,
      overview: overviews[i % overviews.length],
      genre_ids: gIds,
    });
  }
  return movies;
}

export function getImageUrl(path: string, _size?: string): string {
  return path;
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
  genres: genreMap,
  selectedMovie: null,
  isLoading: false,
  loadingProgress: 0,
  loadedCount: 0,

  fetchGenres: () => {
    set({ genres: genreMap });
  },

  fetchMovies: (count: number) => {
    set({ isLoading: true, loadingProgress: 0, loadedCount: 0 });

    const batchSize = Math.max(100, Math.floor(count / 20));
    let loaded = 0;

    const loadBatch = () => {
      const remaining = count - loaded;
      const currentBatch = Math.min(batchSize, remaining);
      loaded += currentBatch;
      const progress = (loaded / count) * 100;

      if (loaded >= count) {
        const allMovies = generateMovies(count);
        set({
          movies: allMovies,
          isLoading: false,
          loadingProgress: 100,
          loadedCount: count,
        });
      } else {
        set({ loadingProgress: progress, loadedCount: loaded });
        setTimeout(loadBatch, 50);
      }
    };

    setTimeout(loadBatch, 100);
  },

  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
}));
