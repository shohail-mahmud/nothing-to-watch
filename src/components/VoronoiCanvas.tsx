import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useMovieStore, getImageUrl, Movie } from '../store/movieStore';

interface MovieNode {
  movie: Movie;
  x: number;
  y: number;
  size: number;
}

const MoviePoster = memo(({ node, onClick, onMouseEnter, onMouseLeave }: {
  node: MovieNode;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  return (
    <div
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: node.size,
        height: node.size * 1.5,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        src={getImageUrl(node.movie.poster_path, 'w200')}
        alt=""
        className="w-full h-full object-cover rounded-sm pointer-events-none"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}, (prevProps, nextProps) => prevProps.node.movie.id === nextProps.node.movie.id);

MoviePoster.displayName = 'MoviePoster';

const VoronoiCanvas = () => {
  const { movies, setSelectedMovie, genres } = useMovieStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const [visibleRange, setVisibleRange] = useState({ startRow: 0, endRow: 100, startCol: 0, endCol: 100 });
  const rafId = useRef<number | null>(null);

  const posterWidth = 90;
  const posterHeight = posterWidth * 1.5;
  const gap = 2;

  const gridInfo = useMemo(() => {
    const columns = Math.ceil(Math.sqrt(movies.length * 1.5));
    const rows = Math.ceil(movies.length / columns);
    const gridWidth = columns * (posterWidth + gap);
    const gridHeight = rows * (posterHeight + gap);
    return { columns, rows, gridWidth, gridHeight };
  }, [movies.length]);

  const nodes = useMemo(() => {
    if (movies.length === 0) return [];
    const { columns } = gridInfo;
    return movies.map((movie, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return {
        movie,
        x: col * (posterWidth + gap),
        y: row * (posterHeight + gap),
        size: posterWidth,
      };
    });
  }, [movies, gridInfo]);

  useEffect(() => {
    if (nodes.length === 0 || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const initialX = (containerWidth - gridInfo.gridWidth * 0.8) / 2;
    const initialY = (containerHeight - gridInfo.gridHeight * 0.8) / 2;
    setTransform({ x: initialX, y: initialY, scale: 0.8 });
  }, [nodes.length, gridInfo]);

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const { columns } = gridInfo;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const cellWidth = posterWidth + gap;
    const cellHeight = posterHeight + gap;
    const worldLeft = -transform.x / transform.scale;
    const worldTop = -transform.y / transform.scale;
    const worldRight = (containerWidth - transform.x) / transform.scale;
    const worldBottom = (containerHeight - transform.y) / transform.scale;
    const buffer = 2;
    const startCol = Math.max(0, Math.floor(worldLeft / cellWidth) - buffer);
    const endCol = Math.min(columns, Math.ceil(worldRight / cellWidth) + buffer);
    const startRow = Math.max(0, Math.floor(worldTop / cellHeight) - buffer);
    const endRow = Math.min(gridInfo.rows, Math.ceil(worldBottom / cellHeight) + buffer);
    setVisibleRange({ startRow, endRow, startCol, endCol });
  }, [transform, gridInfo, nodes.length]);

  useEffect(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => updateVisibleRange());
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [updateVisibleRange]);

  const visibleNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    const { columns } = gridInfo;
    const result: MovieNode[] = [];
    for (let row = visibleRange.startRow; row < visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col < visibleRange.endCol; col++) {
        const index = row * columns + col;
        if (index < nodes.length) result.push(nodes[index]);
      }
    }
    return result;
  }, [nodes, gridInfo, visibleRange]);

  const constrainTransform = useCallback((x: number, y: number, scale: number) => {
    if (nodes.length === 0 || !containerRef.current) return { x, y };
    const scaledGridWidth = gridInfo.gridWidth * scale;
    const scaledGridHeight = gridInfo.gridHeight * scale;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const minX = Math.min(0, containerWidth - scaledGridWidth);
    const maxX = Math.max(0, containerWidth - scaledGridWidth);
    const minY = Math.min(0, containerHeight - scaledGridHeight);
    const maxY = Math.max(0, containerHeight - scaledGridHeight);
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, [nodes.length, gridInfo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    dragDistance.current = 0;
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isDragging) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      dragDistance.current += Math.abs(newX - transform.x) + Math.abs(newY - transform.y);
      const constrained = constrainTransform(newX, newY, transform.scale);
      setTransform(prev => ({ ...prev, x: constrained.x, y: constrained.y }));
    }
  }, [isDragging, transform, constrainTransform]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(4, transform.scale * delta));
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;
      const newX = mouseX - worldX * newScale;
      const newY = mouseY - worldY * newScale;
      const constrained = constrainTransform(newX, newY, newScale);
      setTransform({ x: constrained.x, y: constrained.y, scale: newScale });
    }
  }, [transform, constrainTransform]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const delta = direction === 'in' ? 1.4 : 0.6;
    const newScale = Math.max(0.2, Math.min(4, transform.scale * delta));
    if (containerRef.current) {
      const centerX = containerRef.current.clientWidth / 2;
      const centerY = containerRef.current.clientHeight / 2;
      const worldX = (centerX - transform.x) / transform.scale;
      const worldY = (centerY - transform.y) / transform.scale;
      const newX = centerX - worldX * newScale;
      const newY = centerY - worldY * newScale;
      const constrained = constrainTransform(newX, newY, newScale);
      setTransform({ x: constrained.x, y: constrained.y, scale: newScale });
    }
  }, [transform, constrainTransform]);

  const handlePosterClick = useCallback((movie: Movie) => {
    if (dragDistance.current < 10) setSelectedMovie(movie);
  }, [setSelectedMovie]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden select-none"
        style={{ background: '#0a0a0a', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsDragging(false); setHoveredMovie(null); }}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: gridInfo.gridWidth,
            height: gridInfo.gridHeight,
            willChange: 'transform',
          }}
        >
          {visibleNodes.map((node) => (
            <MoviePoster
              key={node.movie.id}
              node={node}
              onClick={() => handlePosterClick(node.movie)}
              onMouseEnter={() => setHoveredMovie(node.movie)}
              onMouseLeave={() => setHoveredMovie(null)}
            />
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="fixed top-3 right-3 flex flex-col gap-1.5 z-50">
          <button
            onClick={() => handleZoom('in')}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hover Info Panel */}
      {hoveredMovie && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 12, window.innerWidth - 260),
            top: Math.min(mousePos.y + 12, window.innerHeight - 150),
          }}
        >
          <div className="bg-neutral-900/95 border border-neutral-800 text-white p-2.5 rounded-lg w-56">
            <h3 className="font-medium text-xs mb-1 truncate">{hoveredMovie.title}</h3>
            <div className="text-[10px] text-neutral-500 mb-1.5">
              {hoveredMovie.release_date?.split('-')[0] || 'N/A'} • ★ {hoveredMovie.vote_average?.toFixed(1) || 'N/A'}
            </div>
            {hoveredMovie.genre_ids && hoveredMovie.genre_ids.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-1.5">
                {hoveredMovie.genre_ids.slice(0, 2).map((genreId) => {
                  const genreName = genres[genreId];
                  return genreName ? (
                    <span key={genreId} className="px-1 py-0.5 bg-neutral-800 rounded text-[9px] text-neutral-400">
                      {genreName}
                    </span>
                  ) : null;
                })}
              </div>
            )}
            {hoveredMovie.overview && (
              <p className="text-[10px] text-neutral-400 line-clamp-2">{hoveredMovie.overview}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VoronoiCanvas;
