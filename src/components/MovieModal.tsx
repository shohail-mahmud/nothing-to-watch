import React, { useState } from 'react';
import { useMovieStore, getImageUrl } from '../store/movieStore';

const MovieModal: React.FC = () => {
  const { selectedMovie, setSelectedMovie } = useMovieStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (selectedMovie) {
      await navigator.clipboard.writeText(selectedMovie.title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!selectedMovie) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
      onClick={() => setSelectedMovie(null)}
    >
      <div
        className="relative w-full max-w-xs md:max-w-md bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedMovie(null)}
          className="absolute top-2 right-2 md:top-3 md:right-3 z-10 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors text-xs md:text-sm"
        >
          ✕
        </button>

        {/* Content */}
        <div className="p-4 md:p-6 flex flex-row gap-3 md:gap-4">
          <img
            src={getImageUrl(selectedMovie.poster_path, 'w300')}
            alt={selectedMovie.title}
            className="w-16 h-24 md:w-32 md:h-48 object-cover rounded-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0 flex flex-col justify-center pr-5 overflow-hidden">
            <div className="flex items-start gap-1">
              <h2 className="text-[11px] md:text-lg font-semibold text-white leading-tight line-clamp-2 break-words">
                {selectedMovie.title}
              </h2>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-0.5 text-neutral-500 hover:text-white transition-colors"
                title="Copy movie name"
              >
                {copied ? (
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm mt-1 md:mt-1.5">
              <span className="flex items-center gap-0.5 text-yellow-400">
                ★ {typeof selectedMovie.vote_average === 'number' ? selectedMovie.vote_average.toFixed(1) : 'N/A'}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-400">
                {selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <p className="text-[10px] md:text-sm text-neutral-400 leading-relaxed line-clamp-3 md:line-clamp-5 break-words">
            {selectedMovie.overview || 'No overview available for this movie.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
