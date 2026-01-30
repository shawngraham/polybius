
import React from 'react';
import { HeritageDataItem } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const ChartView: React.FC<ChartViewProps> = ({ data, config, theme }) => {
  const categoryKey = config.categoryKey || 'category';
  
  // Count occurrences of categorical data
  const counts = data.reduce((acc, item) => {
    const val = item[categoryKey]?.toString() || 'Uncategorized';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-full w-full p-10 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Distribution Analysis</h3>
      
      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 'bold' }} 
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} className={theme.accent.replace('bg-', 'fill-')} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 italic text-sm">
            Mapping column "{categoryKey}" resulted in no data.
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Total Records</div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Grouping By</div>
          <div className="text-lg font-bold truncate">"{categoryKey}"</div>
        </div>
      </div>
    </div>
  );
};

export default ChartView;
