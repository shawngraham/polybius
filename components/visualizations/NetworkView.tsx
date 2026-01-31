import React, { useMemo, useState, useRef, useCallback } from 'react';
import { HeritageDataItem } from '../../types';

interface NetworkViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

interface NodePos { x: number; y: number; }
interface EdgeInfo { source: number; target: number; weight: number; }

function buildEdges(data: HeritageDataItem[], connectionsKey: string, labelKey: string): EdgeInfo[] {
  const edgeMap = new Map<string, { source: number; target: number; weight: number }>();
  data.forEach((item, idx) => {
    const connections = item[connectionsKey];
    const connectionList = typeof connections === 'string' ? connections.split(',').map(s => s.trim()) : connections;
    if (!Array.isArray(connectionList)) return;

    connectionList.forEach((targetId: any) => {
      const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
      if (targetIdx === -1 || targetIdx === idx) return;
      const a = Math.min(idx, targetIdx);
      const b = Math.max(idx, targetIdx);
      const key = `${a}-${b}`;
      const existing = edgeMap.get(key);
      if (existing) existing.weight += 1;
      else edgeMap.set(key, { source: a, target: b, weight: 1 });
    });
  });
  return [...edgeMap.values()];
}

function computeNodeDegrees(edges: EdgeInfo[], nodeCount: number): number[] {
  const degrees = new Array(nodeCount).fill(0);
  for (const e of edges) {
    degrees[e.source] += e.weight;
    degrees[e.target] += e.weight;
  }
  return degrees;
}

function forceDirectedLayout(data: HeritageDataItem[], edges: EdgeInfo[], width: number, height: number, iterations: number = 250): NodePos[] {
  const n = data.length;
  if (n === 0) return [];
  const k = Math.sqrt((width * height) / n) * 0.9;
  const cx = width / 2;
  const cy = height / 2;

  const positions: NodePos[] = data.map((_, i) => ({
    x: cx + (Math.random() - 0.5) * 50,
    y: cy + (Math.random() - 0.5) * 50,
  }));

  let temp = width / 10;
  for (let iter = 0; iter < iterations; iter++) {
    const disp = positions.map(() => ({ x: 0, y: 0 }));
    // Repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (k * k) / dist;
        disp[i].x += (dx / dist) * force;
        disp[i].y += (dy / dist) * force;
        disp[j].x -= (dx / dist) * force;
        disp[j].y -= (dy / dist) * force;
      }
    }
    // Attraction
    for (const { source, target, weight } of edges) {
      const dx = positions[source].x - positions[target].x;
      const dy = positions[source].y - positions[target].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k * (0.3 + weight * 0.4);
      disp[source].x -= (dx / dist) * force;
      disp[source].y -= (dy / dist) * force;
      disp[target].x += (dx / dist) * force;
      disp[target].y += (dy / dist) * force;
    }
    // Gravity & Update
    for (let i = 0; i < n; i++) {
      disp[i].x -= (positions[i].x - cx) * 0.05;
      disp[i].y -= (positions[i].y - cy) * 0.05;
      const dlen = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y) || 0.01;
      positions[i].x += (disp[i].x / dlen) * Math.min(dlen, temp);
      positions[i].y += (disp[i].y / dlen) * Math.min(dlen, temp);
    }
    temp *= 0.98;
  }
  return positions;
}

const NetworkView: React.FC<NetworkViewProps> = ({ data, config, theme }) => {
  const connectionsKey = config.connectionsKey || 'connections';
  const labelKey = config.labelKey || 'label';
  const configMinWeight = config.minWeight || 1;
  
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const svgWidth = 800;
  const svgHeight = 600;

  const edges = useMemo(() => buildEdges(data, connectionsKey, labelKey), [data, connectionsKey, labelKey]);
  const filteredEdges = useMemo(() => edges.filter(e => e.weight >= configMinWeight), [edges, configMinWeight]);
  const nodeDegrees = useMemo(() => computeNodeDegrees(filteredEdges, data.length), [filteredEdges, data.length]);
  const maxDegree = Math.max(...nodeDegrees, 1);
  const positions = useMemo(() => forceDirectedLayout(data, filteredEdges, svgWidth, svgHeight), [data, filteredEdges]);

  // Determine which nodes/edges to highlight on hover
  const connectedToHover = useMemo(() => {
    if (hoveredNode === null) return new Set();
    const neighbors = new Set([hoveredNode]);
    filteredEdges.forEach(e => {
      if (e.source === hoveredNode) neighbors.add(e.target);
      if (e.target === hoveredNode) neighbors.add(e.source);
    });
    return neighbors;
  }, [hoveredNode, filteredEdges]);

  // Zoom/Pan logic remains largely the same
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: svgWidth, h: svgHeight });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(v => ({ x: v.x + (v.w - v.w * scale) / 2, y: v.y + (v.h - v.h * scale) / 2, w: v.w * scale, h: v.h * scale }));
  };

  return (
    <div className="h-full w-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-2 px-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tighter opacity-40">Network Analysis</h3>
          <p className="text-[10px] opacity-30">Weight Filter: ≥{configMinWeight}</p>
        </div>
        <button onClick={() => setViewBox({ x: 0, y: 0, w: svgWidth, h: svgHeight })} className="text-[10px] font-bold uppercase p-2 hover:bg-current/10 rounded">Reset View</button>
      </div>

      <div className="flex-1 rounded-3xl border border-current/10 bg-current/[0.02] overflow-hidden relative">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full touch-none"
          onWheel={handleWheel}
          onMouseDown={e => { setIsPanning(true); panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y }; }}
          onMouseMove={e => {
            if (!isPanning) return;
            const dx = (e.clientX - panStart.current.x) * (viewBox.w / svgRef.current!.clientWidth);
            const dy = (e.clientY - panStart.current.y) * (viewBox.h / svgRef.current!.clientHeight);
            setViewBox(v => ({ ...v, x: panStart.current.vx - dx, y: panStart.current.vy - dy }));
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => { setIsPanning(false); setHoveredNode(null); }}
        >
          {/* Edges Layer */}
          {filteredEdges.map((edge, i) => {
            const isDimmed = hoveredNode !== null && !connectedToHover.has(edge.source) && !connectedToHover.has(edge.target);
            const isHighlighted = hoveredNode !== null && (edge.source === hoveredNode || edge.target === hoveredNode);
            return (
              <line
                key={i}
                x1={positions[edge.source].x} y1={positions[edge.source].y}
                x2={positions[edge.target].x} y2={positions[edge.target].y}
                stroke={theme.accentHex}
                strokeWidth={isHighlighted ? 3 : 1 + (edge.weight * 0.5)}
                opacity={isDimmed ? 0.05 : isHighlighted ? 0.8 : 0.2}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes Layer */}
          {data.map((item, i) => {
            if (nodeDegrees[i] === 0 && configMinWeight > 1) return null;
            const { x, y } = positions[i];
            const r = 5 + (nodeDegrees[i] / maxDegree) * 15;
            const isDimmed = hoveredNode !== null && !connectedToHover.has(i);
            const isActive = hoveredNode === i;

            return (
              <g 
                key={i} 
                onMouseEnter={() => setHoveredNode(i)}
                className="cursor-pointer transition-all duration-300"
                style={{ opacity: isDimmed ? 0.15 : 1 }}
              >
                <circle
                  cx={x} cy={y} r={r + 4}
                  fill="transparent"
                  stroke={isActive ? theme.accentHex : 'transparent'}
                  strokeWidth={2}
                />
                <circle
                  cx={x} cy={y} r={r}
                  fill={theme.accentHex}
                />
                {/* Label with "Halo" for legibility */}
                <text
                  x={x} y={y + r + 15}
                  textAnchor="middle"
                  fontSize={isActive ? "14" : "10"}
                  fontWeight="bold"
                  className="pointer-events-none fill-current"
                >
                  <tspan x={x} dy="0" stroke="white" strokeWidth="3" strokeLinejoin="round" opacity={0.8}>{item[labelKey]}</tspan>
                  <tspan x={x} dy="0" fill="currentColor">{item[labelKey]}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default NetworkView;
