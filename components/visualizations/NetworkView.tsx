
import React, { useMemo, useState, useRef, useCallback } from 'react';
import { HeritageDataItem } from '../../types';

interface NetworkViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

interface NodePos {
  x: number;
  y: number;
}

interface EdgeInfo {
  source: number;
  target: number;
  weight: number; // count of directed references (1 = one-way, 2 = both directions)
}

// Build edges with weights (count how many times each pair is referenced)
function buildEdges(data: HeritageDataItem[], connectionsKey: string, labelKey: string): EdgeInfo[] {
  const edgeMap = new Map<string, { source: number; target: number; weight: number }>();

  data.forEach((item, idx) => {
    const connections = item[connectionsKey];
    if (!connections || !Array.isArray(connections)) return;

    connections.forEach((targetId: any) => {
      const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
      if (targetIdx === -1 || targetIdx === idx) return;

      // Canonical key: smaller index first
      const a = Math.min(idx, targetIdx);
      const b = Math.max(idx, targetIdx);
      const key = `${a}-${b}`;

      const existing = edgeMap.get(key);
      if (existing) {
        existing.weight += 1;
      } else {
        edgeMap.set(key, { source: a, target: b, weight: 1 });
      }
    });
  });

  return [...edgeMap.values()];
}

// Compute degree (sum of edge weights) per node
function computeNodeDegrees(edges: EdgeInfo[], nodeCount: number): number[] {
  const degrees = new Array(nodeCount).fill(0);
  for (const e of edges) {
    degrees[e.source] += e.weight;
    degrees[e.target] += e.weight;
  }
  return degrees;
}

// Force-directed layout with gravity toward centre, better initialisation,
// and higher iteration count for stable convergence
function forceDirectedLayout(
  data: HeritageDataItem[],
  edges: EdgeInfo[],
  width: number,
  height: number,
  iterations: number = 200
): NodePos[] {
  const n = data.length;
  if (n === 0) return [];

  const area = width * height;
  const k = Math.sqrt(area / n) * 0.85; // optimal spring length
  const cx = width / 2;
  const cy = height / 2;

  // Initialise in a circle (deterministic, well-spread)
  const positions: NodePos[] = data.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    const r = Math.min(width, height) * 0.35;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  let temperature = Math.min(width, height) * 0.15;
  const minTemp = 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    const disp: NodePos[] = positions.map(() => ({ x: 0, y: 0 }));

    // Repulsive forces (all pairs)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[i].x += fx;
        disp[i].y += fy;
        disp[j].x -= fx;
        disp[j].y -= fy;
      }
    }

    // Attractive forces along edges (scaled by weight)
    for (const { source, target, weight } of edges) {
      const dx = positions[source].x - positions[target].x;
      const dy = positions[source].y - positions[target].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k * (0.5 + weight * 0.5);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[source].x -= fx;
      disp[source].y -= fy;
      disp[target].x += fx;
      disp[target].y += fy;
    }

    // Gravity toward centre (prevents disconnected components drifting)
    const gravity = 0.02;
    for (let i = 0; i < n; i++) {
      disp[i].x -= (positions[i].x - cx) * gravity;
      disp[i].y -= (positions[i].y - cy) * gravity;
    }

    // Apply displacements clamped by temperature
    for (let i = 0; i < n; i++) {
      const dist = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y) || 0.01;
      const limitedDist = Math.min(dist, temperature);
      positions[i].x += (disp[i].x / dist) * limitedDist;
      positions[i].y += (disp[i].y / dist) * limitedDist;

      // Clamp to bounds
      const pad = 50;
      positions[i].x = Math.max(pad, Math.min(width - pad, positions[i].x));
      positions[i].y = Math.max(pad, Math.min(height - pad, positions[i].y));
    }

    // Adaptive cooling
    temperature = Math.max(minTemp, temperature * 0.97);
  }

  return positions;
}

const NetworkView: React.FC<NetworkViewProps> = ({ data, config, theme }) => {
  const connectionsKey = config.connectionsKey || 'connections';
  const labelKey = config.labelKey || 'label';

  const svgWidth = 500;
  const svgHeight = 400;

  const edges = useMemo(() => buildEdges(data, connectionsKey, labelKey), [data, connectionsKey, labelKey]);
  const nodeDegrees = useMemo(() => computeNodeDegrees(edges, data.length), [edges, data.length]);
  const maxDegree = Math.max(...nodeDegrees, 1);

  const positions = useMemo(
    () => forceDirectedLayout(data, edges, svgWidth, svgHeight, 200),
    [data, edges]
  );

  const maxWeight = Math.max(...edges.map(e => e.weight), 1);

  // Weight filter state
  const [minWeight, setMinWeight] = useState(1);

  const filteredEdges = useMemo(
    () => edges.filter(e => e.weight >= minWeight),
    [edges, minWeight]
  );

  // Nodes visible = nodes that have at least one visible edge
  const visibleNodes = useMemo(() => {
    if (minWeight <= 1) return new Set(data.map((_, i) => i));
    const s = new Set<number>();
    for (const e of filteredEdges) {
      s.add(e.source);
      s.add(e.target);
    }
    return s;
  }, [filteredEdges, minWeight, data]);

  // Zoom and pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: svgWidth, h: svgHeight });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = prev.w * scaleFactor;
      const newH = prev.h * scaleFactor;
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.current.x) * scaleX;
    const dy = (e.clientY - panStart.current.y) * scaleY;
    setViewBox(prev => ({
      ...prev,
      x: panStart.current.vx - dx,
      y: panStart.current.vy - dy,
    }));
  }, [isPanning, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: svgWidth, h: svgHeight });
  }, []);

  return (
    <div className="h-full w-full p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Entangled Networks</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleWheel({ deltaY: -100, preventDefault: () => {} } as any)}
            className="w-7 h-7 rounded border border-current/10 flex items-center justify-center text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
            title="Zoom in"
          >+</button>
          <button
            onClick={() => handleWheel({ deltaY: 100, preventDefault: () => {} } as any)}
            className="w-7 h-7 rounded border border-current/10 flex items-center justify-center text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
            title="Zoom out"
          >&minus;</button>
          <button
            onClick={resetView}
            className="px-2 h-7 rounded border border-current/10 flex items-center justify-center text-[10px] font-bold opacity-50 hover:opacity-100 transition-opacity"
            title="Reset view"
          >Reset</button>
        </div>
      </div>

      {/* Edge weight filter */}
      {maxWeight > 1 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <label className="text-[10px] font-bold opacity-50 uppercase whitespace-nowrap">Min edge weight:</label>
          <input
            type="range"
            min={1}
            max={maxWeight}
            step={1}
            value={minWeight}
            onChange={(e) => setMinWeight(Number(e.target.value))}
            className="flex-1 h-1 accent-current opacity-60"
          />
          <span className="text-[10px] font-bold opacity-60 min-w-[24px] text-right">{minWeight}</span>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden bg-current/5 rounded-2xl border border-current/10">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Edges */}
          {filteredEdges.map(({ source, target, weight }) => {
            if (source >= positions.length || target >= positions.length) return null;
            const x1 = positions[source].x;
            const y1 = positions[source].y;
            const x2 = positions[target].x;
            const y2 = positions[target].y;

            // Scale stroke width and opacity by weight
            const strokeW = 1.5 + (weight / maxWeight) * 3;
            const opacity = 0.25 + (weight / maxWeight) * 0.45;

            return (
              <line
                key={`e-${source}-${target}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={theme.accentHex}
                strokeWidth={strokeW}
                opacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {data.map((item, idx) => {
            if (idx >= positions.length) return null;
            if (!visibleNodes.has(idx)) return null;
            const x = positions[idx].x;
            const y = positions[idx].y;

            // Scale node radius by degree
            const degree = nodeDegrees[idx];
            const r = 6 + (degree / maxDegree) * 10;

            return (
              <g key={item.id || idx} className="group">
                <circle
                  cx={x} cy={y} r={r}
                  fill={theme.accentHex}
                  opacity={0.85}
                  className="transition-all"
                  stroke={theme.accentHex}
                  strokeWidth="2"
                  strokeOpacity="0.3"
                />
                <text
                  x={x} y={y + r + 12}
                  fontSize="8"
                  textAnchor="middle"
                  className="fill-current font-bold"
                >
                  {item[labelKey]?.toString() || 'Untitled'}
                </text>
                <text
                  x={x} y={y + 3}
                  fontSize="7"
                  textAnchor="middle"
                  fill="white"
                  className="font-bold pointer-events-none"
                >
                  {degree}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-bold opacity-30 uppercase">
        <span>Force-directed layout &middot; {filteredEdges.length} edge{filteredEdges.length !== 1 ? 's' : ''}</span>
        <span>Scroll to zoom, drag to pan</span>
        <span>Column: {connectionsKey}</span>
      </div>
    </div>
  );
};

export default NetworkView;
