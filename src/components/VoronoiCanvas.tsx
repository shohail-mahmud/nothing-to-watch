import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useMovieStore, getImageUrl, Movie } from '../store/movieStore';

interface MovieNode {
  movie: Movie;
  x: number;
  y: number;
  size: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

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

const HoverPanel = memo(({ movie, mousePos, genres }: {
  movie: Movie;
  mousePos: { x: number; y: number };
  genres: Record<number, string>;
}) => (
  <div
    className="fixed z-50 pointer-events-none"
    style={{
      left: Math.min(mousePos.x + 12, window.innerWidth - 260),
      top: Math.min(mousePos.y + 12, window.innerHeight - 150),
    }}
  >
    <div className="bg-neutral-900/95 border border-neutral-800 text-white p-2.5 rounded-lg w-56">
      <h3 className="font-medium text-xs mb-1 truncate">{movie.title}</h3>
      <div className="text-[10px] text-neutral-500 mb-1.5">
        {movie.release_date?.split('-')[0] || 'N/A'} • ★ {movie.vote_average?.toFixed(1) || 'N/A'}
      </div>
      {movie.genre_ids && movie.genre_ids.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1.5">
          {movie.genre_ids.slice(0, 2).map((gid) => {
            const name = genres[gid];
            return name ? (
              <span key={gid} className="px-1 py-0.5 bg-neutral-800 rounded text-[9px] text-neutral-400">
                {name}
              </span>
            ) : null;
          })}
        </div>
      )}
      {movie.overview && (
        <p className="text-[10px] text-neutral-400 line-clamp-2">{movie.overview}</p>
      )}
    </div>
  </div>
));

HoverPanel.displayName = 'HoverPanel';

const VoronoiCanvas = () => {
  const { movies, setSelectedMovie, genres } = useMovieStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 0.8 });
  const [visibleNodes, setVisibleNodes] = useState<MovieNode[]>([]);
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const lastTouchDist = useRef(0);

  const posterWidth = 90;
  const posterHeight = posterWidth * 1.5;
  const gap = 2;

  const gridInfo = useMemo(() => {
    const columns = Math.ceil(Math.sqrt(movies.length * 1.5));
    const rows = Math.ceil(movies.length / columns);
    return { columns, rows, gridWidth: columns * (posterWidth + gap), gridHeight: rows * (posterHeight + gap) };
  }, [movies.length]);

  const nodes = useMemo(() => {
    return movies.map((movie, i) => ({
      movie,
      x: (i % gridInfo.columns) * (posterWidth + gap),
      y: Math.floor(i / gridInfo.columns) * (posterHeight + gap),
      size: posterWidth,
    }));
  }, [movies, gridInfo]);

  const updateView = useCallback(() => {
    if (!containerRef.current || !innerRef.current) return;
    const t = transformRef.current;
    innerRef.current.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`;
    
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
    const ec = Math.min(gridInfo.columns, Math.ceil(wr / cellW) + buf);
    const sr = Math.max(0, Math.floor(wt / cellH) - buf);
    const er = Math.min(gridInfo.rows, Math.ceil(wb / cellH) + buf);
    
    const visible: MovieNode[] = [];
    for (let r = sr; r < er; r++) {
      for (let c = sc; c < ec; c++) {
        const idx = r * gridInfo.columns + c;
        if (idx < nodes.length) visible.push(nodes[idx]);
      }
    }
    setVisibleNodes(visible);
  }, [nodes, gridInfo]);

  const constrain = (x: number, y: number, scale: number) => {
    if (!containerRef.current) return { x, y };
    const sw = gridInfo.gridWidth * scale;
    const sh = gridInfo.gridHeight * scale;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    return {
      x: Math.max(Math.min(0, cw - sw), Math.min(Math.max(0, cw - sw), x)),
      y: Math.max(Math.min(0, ch - sh), Math.min(Math.max(0, ch - sh), y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    dragDistance.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    dragDistance.current += Math.abs(newX - transformRef.current.x) + Math.abs(newY - transformRef.current.y);
    const constrained = constrain(newX, newY, transformRef.current.scale);
    transformRef.current = { ...transformRef.current, ...constrained };
    updateView();
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(4, transformRef.current.scale * delta));
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - transformRef.current.x) / transformRef.current.scale;
    const worldY = (mouseY - transformRef.current.y) / transformRef.current.scale;
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;
    transformRef.current = { ...constrain(newX, newY, newScale), scale: newScale };
    updateView();
  };

  useEffect(() => { updateView(); }, [updateView]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden touch-none"
      style={{ background: '#0a0a0a', cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <div ref={innerRef} style={{ transformOrigin: '0 0', position: 'absolute', width: gridInfo.gridWidth, height: gridInfo.gridHeight }}>
        {visibleNodes.map((node) => (
          <MoviePoster
            key={node.movie.id}
            node={node}
            onClick={() => { if (dragDistance.current < 10) setSelectedMovie(node.movie); }}
            onMouseEnter={() => setHoveredMovie(node.movie)}
            onMouseLeave={() => setHoveredMovie(null)}
          />
        ))}
      </div>
      {hoveredMovie && <HoverPanel movie={hoveredMovie} mousePos={mousePos} genres={genres} />}
    </div>
  );
};

export default VoronoiCanvas;
