
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
  const orientation = config.orientation || 'vertical';

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

// Group events by date, assigning each event an index-based slot
// so that shared-date events fan out rather than stacking
function buildEventSlots(sortedData: HeritageDataItem[], dateKey: string) {
  const groups: Map<number, HeritageDataItem[]> = new Map();
  for (const item of sortedData) {
    const d = Number(item[dateKey]);
    const arr = groups.get(d) || [];
    arr.push(item);
    groups.set(d, arr);
  }

  // Flatten into slots: each event gets its own sequential slot index
  // but events sharing a date are grouped together
  const slots: { item: HeritageDataItem; slotIndex: number; isFirstInGroup: boolean; groupSize: number; date: number }[] = [];
  let slotIndex = 0;
  const sortedDates = [...groups.keys()].sort((a, b) => a - b);

  for (const date of sortedDates) {
    const items = groups.get(date)!;
    items.forEach((item, i) => {
      slots.push({
        item,
        slotIndex,
        isFirstInGroup: i === 0,
        groupSize: items.length,
        date,
      });
      slotIndex++;
    });
  }

  return slots;
}

const HorizontalTimeline: React.FC<TimelineInnerProps> = ({ sortedData, dateKey, labelKey, minDate, maxDate, range, theme }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  const slots = buildEventSlots(sortedData, dateKey);
  const totalSlots = slots.length;

  const minSpacingPx = 110;
  const minWidthNeeded = totalSlots * minSpacingPx;

  useEffect(() => {
    if (scrollRef.current) {
      setNeedsScroll(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
    }
  }, [sortedData]);

  const innerWidthStyle = minWidthNeeded > 600 ? `${Math.max(minWidthNeeded, 100)}px` : '100%';

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
          <div className={`absolute top-1/2 left-[2%] right-[2%] h-px ${theme.text} opacity-20`} />

          {/* Date Points - evenly spaced by slot index */}
          <div className="h-full relative flex items-center">
            {slots.map(({ item, slotIndex, isFirstInGroup, groupSize, date }, arrIdx) => {
              const pos = totalSlots > 1
                ? 2 + (slotIndex / (totalSlots - 1)) * 96
                : 50;
              const isTop = arrIdx % 2 === 0;

              // Show date only for first item in a group; subsequent items in same date group show "↳"
              const dateDisplay = isFirstInGroup ? String(date) : '↳';

              return (
                <div
                  key={item.id || arrIdx}
                  className="absolute flex flex-col items-center group"
                  style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                >
                  {isTop && (
                    <div className="mb-4 text-center pb-4 transition-transform group-hover:scale-110" style={{ width: `${Math.max(80, minSpacingPx - 20)}px` }}>
                      <span className={`text-sm font-bold block ${!isFirstInGroup ? 'opacity-40 text-xs' : ''}`}>{dateDisplay}</span>
                      <span className="text-xs opacity-70 block truncate px-1">{item[labelKey] || 'Untitled'}</span>
                    </div>
                  )}

                  <div
                    className={`rounded-full transition-all group-hover:scale-150 ${theme.accent} shadow-lg ring-4 ring-current/10`}
                    style={{ width: isFirstInGroup ? 12 : 8, height: isFirstInGroup ? 12 : 8 }}
                  />

                  {!isTop && (
                    <div className="mt-4 text-center pt-4 transition-transform group-hover:scale-110" style={{ width: `${Math.max(80, minSpacingPx - 20)}px` }}>
                      <span className={`text-sm font-bold block ${!isFirstInGroup ? 'opacity-40 text-xs' : ''}`}>{dateDisplay}</span>
                      <span className="text-xs opacity-70 block truncate px-1">{item[labelKey] || 'Untitled'}</span>
                    </div>
                  )}
                </div>
              );
            })}
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
  const slots = buildEventSlots(sortedData, dateKey);
  const totalSlots = slots.length;

  // Each event gets a fixed-height row so nothing overlaps
  const rowHeight = 64;
  const containerMinHeight = Math.max(totalSlots * rowHeight, 300);

  return (
    <div className="h-full w-full p-12 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Temporal Progression</h3>

      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
        <div className="relative pl-8" style={{ minHeight: `${containerMinHeight}px` }}>
          {/* Vertical Axis */}
          <div className={`absolute top-0 bottom-0 left-6 w-px ${theme.text} opacity-20`} />

          {slots.map(({ item, slotIndex, isFirstInGroup, groupSize, date }, arrIdx) => {
            const top = slotIndex * rowHeight;

            return (
              <div
                key={item.id || arrIdx}
                className="absolute flex items-center group"
                style={{ top: `${top}px`, left: 0 }}
              >
                {/* Connecting bracket for shared-date events */}
                {isFirstInGroup && groupSize > 1 && (
                  <div
                    className={`absolute left-[23px] border-l-2 border-dashed opacity-20`}
                    style={{
                      borderColor: theme.accentHex,
                      top: '6px',
                      height: `${(groupSize - 1) * rowHeight}px`,
                    }}
                  />
                )}

                <div
                  className={`rounded-full transition-all group-hover:scale-150 ${theme.accent} shadow-lg ring-4 ring-current/10 relative z-10`}
                  style={{
                    marginLeft: '18px',
                    width: isFirstInGroup ? 12 : 8,
                    height: isFirstInGroup ? 12 : 8,
                    marginTop: isFirstInGroup ? 0 : 2,
                  }}
                />

                <div className="ml-6 transition-transform group-hover:scale-105 flex items-baseline gap-3">
                  {isFirstInGroup ? (
                    <span className="text-sm font-bold min-w-[60px]">{date}</span>
                  ) : (
                    <span className="text-[10px] opacity-30 min-w-[60px] italic">same date</span>
                  )}
                  <span className="text-xs opacity-70">{item[labelKey] || 'Untitled'}</span>
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
