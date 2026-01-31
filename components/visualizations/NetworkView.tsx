import React, { useMemo, useState, useRef, useCallback } from 'react';
import { HeritageDataItem } from '../../types';

interface NetworkViewProps {
  data: DataItem[];
}

const NetworkView: React.FC<NetworkViewProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });

  // 1. Handle Responsive Resizing
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // 2. Process Data with Memoization
  // This prevents the graph physics from restarting every time the parent component updates
  const graphData = useMemo(() => {
    // Create nodes array - ensure IDs are strings for D3 consistency
    const nodes = data.map((item) => ({
      ...item,
      id: String(item.id),
      name: item.label || String(item.id),
    }));

    // Create a Set of valid IDs for quick lookup validation
    const validIds = new Set(nodes.map((n) => n.id));
    
    const links: { source: string; target: string }[] = [];

    data.forEach((item) => {
      const sourceId = String(item.id);
      
      // FIX: Robust parsing of the "connections" string
      if (item.connections && typeof item.connections === 'string') {
        const targets = item.connections
          .split(',')
          .map((t) => t.trim()) // FIX: Removes the "space bug" (e.g., "ID1, ID2")
          .filter((t) => t !== ""); // Remove empty strings from trailing commas

        targets.forEach((targetId) => {
          // FIX: Validation - Only create link if target exists in node list
          // This prevents the force engine from crashing on broken references
          if (validIds.has(targetId)) {
            links.push({
              source: sourceId,
              target: targetId,
            });
          }
        });
      }
    });

    // Use a deep clone for the force graph to prevent React/D3 state mutation conflicts
    return JSON.parse(JSON.stringify({ nodes, links }));
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-inner overflow-hidden">
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="label"
          nodeColor={() => '#4f46e5'} // Tailwind Indigo-600
          linkColor={() => '#94a3b8'} // Tailwind Slate-400
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1e293b'; // Slate-800
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();

            // Draw text with background for readability
            if (globalScale > 1.5) {
                ctx.fillText(label, node.x, node.y + 8);
            }
          }}
          cooldownTicks={100} // Stops simulation after it settles
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No connection data found in CSV.
        </div>
      )}
    </div>
  );
};

export default NetworkView;
