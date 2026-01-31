
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

// Fruchterman-Reingold force-directed layout
function fruchtermanReingold(
  data: HeritageDataItem[],
  connectionsKey: string,
  labelKey: string,
  width: number,
  height: number,
  iterations: number = 100
): NodePos[] {
  const n = data.length;
  if (n === 0) return [];

  const area = width * height;
  const k = Math.sqrt(area / n); // optimal distance

  // Initialize positions randomly but deterministically (seeded by index)
  const positions: NodePos[] = data.map((_, i) => ({
    x: width * 0.2 + (width * 0.6) * ((i * 7 + 13) % n) / Math.max(n - 1, 1),
    y: height * 0.2 + (height * 0.6) * ((i * 11 + 3) % n) / Math.max(n - 1, 1),
  }));

  // Build adjacency
  const edges: [number, number][] = [];
  data.forEach((item, idx) => {
    const connections = item[connectionsKey];
    if (connections && Array.isArray(connections)) {
      connections.forEach((targetId: any) => {
        const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
        if (targetIdx !== -1 && targetIdx > idx) {
          edges.push([idx, targetIdx]);
        }
      });
    }
  });

  let temperature = width * 0.1;
  const cooling = temperature / (iterations + 1);

  for (let iter = 0; iter < iterations; iter++) {
    const disp: NodePos[] = positions.map(() => ({ x: 0, y: 0 }));

    // Repulsive forces between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = positions[i].x - positions[j].x;
        let dy = positions[i].y - positions[j].y;
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

    // Attractive forces along edges
    for (const [i, j] of edges) {
      let dx = positions[i].x - positions[j].x;
      let dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[i].x -= fx;
      disp[i].y -= fy;
      disp[j].x += fx;
      disp[j].y += fy;
    }

    // Apply displacements with temperature limiting
    for (let i = 0; i < n; i++) {
      const dist = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y) || 0.01;
      const limitedDist = Math.min(dist, temperature);
      positions[i].x += (disp[i].x / dist) * limitedDist;
      positions[i].y += (disp[i].y / dist) * limitedDist;

      // Clamp to bounds with padding
      const pad = 40;
      positions[i].x = Math.max(pad, Math.min(width - pad, positions[i].x));
      positions[i].y = Math.max(pad, Math.min(height - pad, positions[i].y));
    }

    temperature -= cooling;
  }

  return positions;
}

const NetworkView: React.FC<NetworkViewProps> = ({ data, config, theme }) => {
  const connectionsKey = config.connectionsKey || 'connections';
  const labelKey = config.labelKey || 'label';

  const svgWidth = 400;
  const svgHeight = 300;

  const positions = useMemo(
    () => fruchtermanReingold(data, connectionsKey, labelKey, svgWidth, svgHeight, 120),
    [data, connectionsKey, labelKey]
  );

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
      // Zoom toward center of current view
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
           {/* Connections */}
           {data.map((item, idx) => {
             if (idx >= positions.length) return null;
             const x = positions[idx].x;
             const y = positions[idx].y;

             const connections = item[connectionsKey];
             if (connections && Array.isArray(connections)) {
               return connections.map((targetId: any) => {
                 const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
                 if (targetIdx === -1 || targetIdx >= positions.length) return null;
                 const tx = positions[targetIdx].x;
                 const ty = positions[targetIdx].y;

                 return (
                   <line
                     key={`${item.id}-${targetId}`}
                     x1={x} y1={y} x2={tx} y2={ty}
                     stroke="currentColor" strokeWidth="1" className="opacity-20"
                   />
                 );
               });
             }
             return null;
           })}

           {/* Nodes */}
           {data.map((item, idx) => {
             if (idx >= positions.length) return null;
             const x = positions[idx].x;
             const y = positions[idx].y;

             return (
               <g key={item.id || idx} className="group">
                 <circle
                   cx={x} cy={y} r="12"
                   className={`${theme.accent.replace('bg-', 'fill-')} transition-transform group-hover:scale-125`}
                 />
                 <text
                  x={x} y={y + 24}
                  fontSize="8"
                  textAnchor="middle"
                  className="fill-current font-bold"
                 >
                   {item[labelKey]?.toString() || 'Untitled'}
                 </text>
                 <text
                  x={x} y={y + 2}
                  fontSize="6"
                  textAnchor="middle"
                  fill="white"
                  className="font-bold pointer-events-none"
                 >
                   {idx + 1}
                 </text>
               </g>
             );
           })}
        </svg>
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-bold opacity-30 uppercase">
        <span>Fruchterman-Reingold layout</span>
        <span>Scroll to zoom, drag to pan</span>
        <span>Column: {connectionsKey}</span>
      </div>
    </div>
  );
};

export default NetworkView;
