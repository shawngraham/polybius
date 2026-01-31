
import React, { useRef, useEffect, useState } from 'react';
import { HeritageDataItem } from '../../types';

interface TimelineViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const TimelineView: React.FC<TimelineViewProps> = ({ data, config, theme }) => {
  const dateKey = config.dateKey || 'date';
  const labelKey = config.labelKey || 'label';
  const orientation = config.orientation || 'horizontal';

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

  if (orientation === 'vertical') {
    return <VerticalTimeline sortedData={sortedData} dateKey={dateKey} labelKey={labelKey} minDate={minDate} maxDate={maxDate} range={range} theme={theme} />;
  }

  return <HorizontalTimeline sortedData={sortedData} dateKey={dateKey} labelKey={labelKey} minDate={minDate} maxDate={maxDate} range={range} theme={theme} />;
};

interface TimelineInnerProps {
  sortedData: HeritageDataItem[];
  dateKey: string;
  labelKey: string;
  minDate: number;
  maxDate: number;
  range: number;
  theme: any;
}

const HorizontalTimeline: React.FC<TimelineInnerProps> = ({ sortedData, dateKey, labelKey, minDate, maxDate, range, theme }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  // Calculate minimum width needed to avoid label overlap
  // Each label needs ~100px of space minimum
  const minSpacingPx = 100;
  const minWidthNeeded = sortedData.length * minSpacingPx;

  useEffect(() => {
    if (scrollRef.current) {
      setNeedsScroll(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
    }
  }, [sortedData]);

  // Use the larger of 100% or minimum needed width
  const innerWidthStyle = minWidthNeeded > 600 ? `${Math.max(minWidthNeeded, 100)}px` : '100%';

  // Greedy label placement to avoid overlap
  // Labels alternate top/bottom; within each row track last right-edge
  const labelPositions = sortedData.map((item, idx) => {
    const pos = ((Number(item[dateKey]) - minDate) / range) * 100;
    const isTop = idx % 2 === 0;
    return { item, pos, isTop, idx };
  });

  return (
    <div className="h-full w-full p-12 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Temporal Progression</h3>

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="relative h-full" style={{ minWidth: innerWidthStyle }}>
          {/* Main Axis */}
          <div className={`absolute top-1/2 left-0 right-0 h-px ${theme.text} opacity-20`} />

          {/* Date Points */}
          <div className="h-full relative flex items-center">
            {labelPositions.map(({ item, pos, isTop, idx }) => (
              <div
                key={item.id || idx}
                className="absolute flex flex-col items-center group"
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              >
                {isTop && (
                  <div className="mb-4 text-center pb-4 transition-transform group-hover:scale-110" style={{ width: `${Math.max(80, minSpacingPx - 10)}px` }}>
                    <span className="text-sm font-bold block">{item[dateKey]}</span>
                    <span className="text-xs opacity-70 block truncate px-1">{item[labelKey] || 'Untitled'}</span>
                  </div>
                )}

                <div className={`w-3 h-3 rounded-full transition-all group-hover:scale-150 ${theme.accent} shadow-lg ring-4 ring-current/10`} />

                {!isTop && (
                  <div className="mt-4 text-center pt-4 transition-transform group-hover:scale-110" style={{ width: `${Math.max(80, minSpacingPx - 10)}px` }}>
                    <span className="text-sm font-bold block">{item[dateKey]}</span>
                    <span className="text-xs opacity-70 block truncate px-1">{item[labelKey] || 'Untitled'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {needsScroll && (
        <div className="text-center text-[10px] font-bold opacity-40 uppercase mt-2">
          Scroll horizontally to see all events
        </div>
      )}

      <div className="mt-auto flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-tighter">
        <span>Start: {minDate}</span>
        <span>Mapped to column: {dateKey}</span>
        <span>End: {maxDate}</span>
      </div>
    </div>
  );
};

const VerticalTimeline: React.FC<TimelineInnerProps> = ({ sortedData, dateKey, labelKey, minDate, maxDate, range, theme }) => {
  return (
    <div className="h-full w-full p-12 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Temporal Progression</h3>

      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
        <div className="relative min-h-full pl-8" style={{ minHeight: `${Math.max(sortedData.length * 80, 300)}px` }}>
          {/* Vertical Axis */}
          <div className={`absolute top-0 bottom-0 left-6 w-px ${theme.text} opacity-20`} />

          {sortedData.map((item, idx) => {
            const pos = ((Number(item[dateKey]) - minDate) / range) * 100;
            return (
              <div
                key={item.id || idx}
                className="absolute flex items-center group"
                style={{ top: `${pos}%`, left: 0, transform: 'translateY(-50%)' }}
              >
                <div className={`w-3 h-3 rounded-full transition-all group-hover:scale-150 ${theme.accent} shadow-lg ring-4 ring-current/10 relative z-10`} style={{ marginLeft: '18px' }} />

                <div className="ml-6 transition-transform group-hover:scale-105">
                  <span className="text-sm font-bold block">{item[dateKey]}</span>
                  <span className="text-xs opacity-70 block">{item[labelKey] || 'Untitled'}</span>
                </div>
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
