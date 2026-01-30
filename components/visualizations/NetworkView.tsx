
import React from 'react';
import { HeritageDataItem } from '../../types';

interface NetworkViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const NetworkView: React.FC<NetworkViewProps> = ({ data, config, theme }) => {
  const connectionsKey = config.connectionsKey || 'connections';
  const labelKey = config.labelKey || 'label';

  // Simple force-directed-ish layout (static)
  const centerX = 200;
  const centerY = 150;
  const radius = 100;

  return (
    <div className="h-full w-full p-8 flex flex-col">
      <h3 className="text-xl font-bold mb-4 uppercase tracking-widest opacity-60">Entangled Networks</h3>
      <div className="flex-1 relative overflow-hidden bg-current/5 rounded-2xl border border-current/10">
        <svg viewBox="0 0 400 300" className="w-full h-full">
           {/* Connections */}
           {data.map((item, idx) => {
             const angle = (idx / data.length) * Math.PI * 2;
             const x = centerX + radius * Math.cos(angle);
             const y = centerY + radius * Math.sin(angle);

             const connections = item[connectionsKey];
             if (connections && Array.isArray(connections)) {
               return connections.map((targetId: any) => {
                 const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
                 if (targetIdx === -1) return null;
                 const targetAngle = (targetIdx / data.length) * Math.PI * 2;
                 const tx = centerX + radius * Math.cos(targetAngle);
                 const ty = centerY + radius * Math.sin(targetAngle);

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
             const angle = (idx / data.length) * Math.PI * 2;
             const x = centerX + radius * Math.cos(angle);
             const y = centerY + radius * Math.sin(angle);

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
      <div className="mt-4 text-[10px] font-bold opacity-30 uppercase text-center">
        Relational mapping via column: {connectionsKey}
      </div>
    </div>
  );
};

export default NetworkView;
