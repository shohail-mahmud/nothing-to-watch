import { useEffect, useState } from 'react';
import { useMovieStore } from '../store/movieStore';
import VoronoiCanvas from '../components/VoronoiCanvas';
import MovieModal from '../components/MovieModal';

function Index() {
  const {
    isLoading,
    selectedMovie,
    fetchMovies,
    fetchGenres,
    loadingProgress,
    loadedCount,
  } = useMovieStore();

  const [started, setStarted] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleStart = (count: number) => {
    setSelectedCount(count);
    setStarted(true);
    fetchMovies(count);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
        {showManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-sm w-full p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">How to Use</h2>
                <button
                  onClick={() => setShowManual(false)}
                  className="text-neutral-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-neutral-400">
                {[
                  'Select how many movies you want to explore',
                  'Drag to pan around the movie collection',
                  'Scroll or use +/- buttons to zoom',
                  'Hover on any poster to see movie info',
                  'Click on a movie for full details',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="w-full mt-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center max-w-xs w-full px-4">
          <h1 className="text-xl font-semibold text-white mb-0.5">Nothing to Watch?</h1>
          <p className="text-[11px] text-neutral-600 mb-6">Explore thousands of movies</p>

          <div className="w-full space-y-2">
            <button
              onClick={() => handleStart(10000)}
              className="w-full py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-all flex items-center justify-between px-3"
            >
              <span>10,000 Movies</span>
              <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Recommended</span>
            </button>
            <button
              onClick={() => handleStart(25000)}
              className="w-full py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-all flex items-center justify-between px-3"
            >
              <span>25,000 Movies</span>
              <span className="text-[10px] text-neutral-500">Mid-range</span>
            </button>
            <button
              onClick={() => handleStart(50000)}
              className="w-full py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-all flex items-center justify-between px-3"
            >
              <span>50,000 Movies</span>
              <span className="text-[10px] text-neutral-500">High-end</span>
            </button>
          </div>

          <button
            onClick={() => setShowManual(true)}
            className="mt-5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How does this work?
          </button>
        </div>

        <div className="absolute bottom-6 flex items-center justify-center w-full">
          <a
            href="https://instagram.com/shohailmahmud09"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-neutral-400 text-[10px] flex items-center gap-1.5 transition-colors"
          >
            a web by @shohailmahmud09
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    const progress = Math.round(loadingProgress);
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative w-12 h-12 mb-6">
            <div className="absolute inset-0 rounded-full border border-neutral-800" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"
              style={{ animationDuration: '1s' }}
            />
            <div
              className="absolute inset-1 rounded-full border border-transparent border-r-neutral-600 animate-spin"
              style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
            />
            <div
              className="absolute inset-2 rounded-full border border-transparent border-b-neutral-700 animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-[10px] font-light">{progress}%</span>
            </div>
          </div>

          <p className="text-neutral-500 text-xs mb-3">
            {loadedCount.toLocaleString()} of {selectedCount?.toLocaleString()} movies
          </p>

          <div className="w-48 h-0.5 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-neutral-700 text-[10px] mt-4">
            {progress < 30
              ? 'Fetching movies...'
              : progress < 60
              ? 'Loading posters...'
              : progress < 90
              ? 'Almost ready...'
              : 'Finishing up...'}
          </p>
        </div>

        {/* Credit on loading screen */}
        <div className="absolute bottom-6 flex items-center justify-center w-full">
          <a
            href="https://instagram.com/shohailmahmud09"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-neutral-400 text-[10px] flex items-center gap-1.5 transition-colors"
          >
            a web by @shohailmahmud09
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <VoronoiCanvas />
      {selectedMovie && <MovieModal />}

      <button
        onClick={() => {
          setStarted(false);
          setSelectedCount(null);
        }}
        className="fixed top-3 left-3 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-400 text-xs z-40 hover:text-white hover:border-neutral-700 transition-all"
      >
        ← Back
      </button>

      {/* TMDB Attribution */}
      <div className="fixed bottom-3 right-3 text-neutral-700 text-[10px] z-40">
        TMDB
      </div>
    </div>
  );
}

export default Index;
