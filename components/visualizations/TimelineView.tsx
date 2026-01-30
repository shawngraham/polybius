
import React from 'react';
import { HeritageDataItem } from '../../types';

interface TimelineViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const TimelineView: React.FC<TimelineViewProps> = ({ data, config, theme }) => {
  const dateKey = config.dateKey || 'date';
  const labelKey = config.labelKey || 'label';

  const sortedData = [...data]
    .filter(d => d[dateKey] !== undefined && !isNaN(Number(d[dateKey])))
    .sort((a, b) => Number(a[dateKey]) - Number(b[dateKey]));

  if (sortedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center opacity-50">
        <div>
          <p className="text-lg font-bold mb-2">No Temporal Data Found</p>
          <p className="text-xs">Ensure the chosen column ("{dateKey}") contains numeric years.</p>
        </div>
      </div>
    );
  }

  const minDate = Number(sortedData[0][dateKey]);
  const maxDate = Number(sortedData[sortedData.length - 1][dateKey]);
  const range = maxDate - minDate || 1;

  return (
    <div className="h-full w-full p-12 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Temporal Progression</h3>
      
      <div className="relative flex-1">
        {/* Main Axis */}
        <div className={`absolute top-1/2 left-0 right-0 h-px ${theme.text} opacity-20`} />
        
        {/* Date Points */}
        <div className="h-full relative flex items-center justify-between">
          {sortedData.map((item, idx) => {
            const pos = ((Number(item[dateKey]) - minDate) / range) * 100;
            const isTop = idx % 2 === 0;
            
            return (
              <div 
                key={item.id || idx} 
                className="absolute flex flex-col items-center group"
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              >
                {isTop && (
                   <div className="mb-4 text-center w-32 pb-4 transition-transform group-hover:scale-110">
                     <span className="text-sm font-bold block">{item[dateKey]}</span>
                     <span className="text-xs opacity-70 block truncate px-2">{item[labelKey] || 'Untitled'}</span>
                   </div>
                )}
                
                <div className={`w-3 h-3 rounded-full transition-all group-hover:scale-150 ${theme.accent} shadow-lg ring-4 ring-current/10`} />
                
                {!isTop && (
                   <div className="mt-4 text-center w-32 pt-4 transition-transform group-hover:scale-110">
                     <span className="text-sm font-bold block">{item[dateKey]}</span>
                     <span className="text-xs opacity-70 block truncate px-2">{item[labelKey] || 'Untitled'}</span>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-tighter">
        <span>Start: {minDate}</span>
        <span>Mapped to column: {dateKey}</span>
        <span>End: {maxDate}</span>
      </div>
    </div>
  );
};

export default TimelineView;
