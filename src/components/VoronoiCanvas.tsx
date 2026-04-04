import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useMovieStore, getImageUrl, Movie } from '../store/movieStore';

interface MovieNode {
  movie: Movie;
  x: number;
  y: number;
  size: number;
}

const posterWidth = 90;
const posterHeight = posterWidth * 1.5;
const gap = 2;

const MoviePoster = memo(({ node, onClick, onMouseEnter, onMouseLeave }: {
  node: MovieNode;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => (
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
), (prev, next) => prev.node.movie.id === next.node.movie.id);

MoviePoster.displayName = 'MoviePoster';

const VoronoiCanvas = () => {
  const { movies, setSelectedMovie, genres } = useMovieStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Use refs for transform to avoid re-renders on every pan/zoom frame
  const transformRef = useRef({ x: 0, y: 0, scale: 0.8 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const isTouching = useRef(false);

  const [visibleNodes, setVisibleNodes] = useState<MovieNode[]>([]);
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState('grab');

  const updateQueued = useRef(false);

  const gridInfo = useMemo(() => {
    const columns = Math.ceil(Math.sqrt(movies.length * 1.5));
    const rows = Math.ceil(movies.length / columns);
    return { columns, rows, gridWidth: columns * (posterWidth + gap), gridHeight: rows * (posterHeight + gap) };
  }, [movies.length]);

  const nodes = useMemo(() => {
    if (movies.length === 0) return [];
    const { columns } = gridInfo;
    return movies.map((movie, i) => ({
      movie,
      x: (i % columns) * (posterWidth + gap),
      y: Math.floor(i / columns) * (posterHeight + gap),
      size: posterWidth,
    }));
  }, [movies, gridInfo]);

  const applyTransform = useCallback(() => {
    if (!innerRef.current) return;
    const t = transformRef.current;
    innerRef.current.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`;
  }, []);

  const constrainTransform = useCallback((x: number, y: number, scale: number) => {
    if (nodes.length === 0 || !containerRef.current) return { x, y };
    const sw = gridInfo.gridWidth * scale;
    const sh = gridInfo.gridHeight * scale;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    return {
      x: Math.max(Math.min(0, cw - sw), Math.min(Math.max(0, cw - sw), x)),
      y: Math.max(Math.min(0, ch - sh), Math.min(Math.max(0, ch - sh), y)),
    };
  }, [nodes.length, gridInfo]);

  const scheduleVisibleUpdate = useCallback(() => {
    if (updateQueued.current) return;
    updateQueued.current = true;
    requestAnimationFrame(() => {
      updateQueued.current = false;
      if (!containerRef.current || nodes.length === 0) return;
      const { columns, rows } = gridInfo;
      const t = transformRef.current;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const cellW = posterWidth + gap;
      const cellH = posterHeight + gap;
      const wl = -t.x / t.scale;
      const wt = -t.y / t.scale;
      const wr = (cw - t.x) / t.scale;
      const wb = (ch - t.y) / t.scale;
      const buf = 2;
      const sc = Math.max(0, Math.floor(wl / cellW) - buf);
      const ec = Math.min(columns, Math.ceil(wr / cellW) + buf);
      const sr = Math.max(0, Math.floor(wt / cellH) - buf);
      const er = Math.min(rows, Math.ceil(wb / cellH) + buf);
      const result: MovieNode[] = [];
      for (let r = sr; r < er; r++) {
        for (let c = sc; c < ec; c++) {
          const idx = r * columns + c;
          if (idx < nodes.length) result.push(nodes[idx]);
        }
      }
      setVisibleNodes(result);
    });
  }, [nodes, gridInfo]);

  // Initial position
  useEffect(() => {
    if (nodes.length === 0 || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const initialX = (cw - gridInfo.gridWidth * 0.8) / 2;
    const initialY = (ch - gridInfo.gridHeight * 0.8) / 2;
    transformRef.current = { x: initialX, y: initialY, scale: 0.8 };
    applyTransform();
    scheduleVisibleUpdate();
  }, [nodes.length, gridInfo, applyTransform, scheduleVisibleUpdate]);

  // --- Mouse handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    dragDistance.current = 0;
    setCursorStyle('grabbing');
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isDragging.current) return;
    const t = transformRef.current;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    dragDistance.current += Math.abs(newX - t.x) + Math.abs(newY - t.y);
    const c = constrainTransform(newX, newY, t.scale);
    transformRef.current = { ...t, x: c.x, y: c.y };
    applyTransform();
    scheduleVisibleUpdate();
  }, [constrainTransform, applyTransform, scheduleVisibleUpdate]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setCursorStyle('grab');
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const t = transformRef.current;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(4, t.scale * delta));
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const wx = (mx - t.x) / t.scale;
      const wy = (my - t.y) / t.scale;
      const c = constrainTransform(mx - wx * newScale, my - wy * newScale, newScale);
      transformRef.current = { x: c.x, y: c.y, scale: newScale };
      applyTransform();
      scheduleVisibleUpdate();
    }
  }, [constrainTransform, applyTransform, scheduleVisibleUpdate]);

  // Attach wheel with passive:false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // --- Touch handlers ---
  const getTouchDist = (touches: React.TouchList | TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList | TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouching.current = true;
    dragDistance.current = 0;
    if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX - transformRef.current.x,
        y: e.touches[0].clientY - transformRef.current.y,
      };
    } else if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDist(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = transformRef.current;

    if (e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      dragDistance.current += Math.abs(newX - t.x) + Math.abs(newY - t.y);
      const c = constrainTransform(newX, newY, t.scale);
      transformRef.current = { ...t, x: c.x, y: c.y };
    } else if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      const center = getTouchCenter(e.touches);

      if (lastTouchDist.current > 0) {
        const scaleFactor = dist / lastTouchDist.current;
        const newScale = Math.max(0.2, Math.min(4, t.scale * scaleFactor));

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const cx = center.x - rect.left;
          const cy = center.y - rect.top;
          const wx = (cx - t.x) / t.scale;
          const wy = (cy - t.y) / t.scale;
          const panX = center.x - lastTouchCenter.current.x;
          const panY = center.y - lastTouchCenter.current.y;
          const c = constrainTransform(cx - wx * newScale + panX, cy - wy * newScale + panY, newScale);
          transformRef.current = { x: c.x, y: c.y, scale: newScale };
        }
      }
      lastTouchDist.current = dist;
      lastTouchCenter.current = center;
    }

    applyTransform();
    scheduleVisibleUpdate();
  }, [constrainTransform, applyTransform, scheduleVisibleUpdate]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isTouching.current = false;
      lastTouchDist.current = 0;
    } else if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX - transformRef.current.x,
        y: e.touches[0].clientY - transformRef.current.y,
      };
      lastTouchDist.current = 0;
    }
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const t = transformRef.current;
    const delta = direction === 'in' ? 1.4 : 0.6;
    const newScale = Math.max(0.2, Math.min(4, t.scale * delta));
    if (containerRef.current) {
      const cx = containerRef.current.clientWidth / 2;
      const cy = containerRef.current.clientHeight / 2;
      const wx = (cx - t.x) / t.scale;
      const wy = (cy - t.y) / t.scale;
      const c = constrainTransform(cx - wx * newScale, cy - wy * newScale, newScale);
      transformRef.current = { x: c.x, y: c.y, scale: newScale };
      applyTransform();
      scheduleVisibleUpdate();
    }
  }, [constrainTransform, applyTransform, scheduleVisibleUpdate]);

  const handlePosterClick = useCallback((movie: Movie) => {
    if (dragDistance.current < 10) setSelectedMovie(movie);
  }, [setSelectedMovie]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden select-none touch-none"
        style={{ background: '#0a0a0a', cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDragging.current = false; setCursorStyle('grab'); setHoveredMovie(null); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={innerRef}
          style={{
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

      {/* Hover Info - desktop only */}
      {hoveredMovie && (
        <div
          className="fixed z-50 pointer-events-none hidden md:block"
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
                {hoveredMovie.genre_ids.slice(0, 2).map((gid) => {
                  const name = genres[gid];
                  return name ? (
                    <span key={gid} className="px-1 py-0.5 bg-neutral-800 rounded text-[9px] text-neutral-400">
                      {name}
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
