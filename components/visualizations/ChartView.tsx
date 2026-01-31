
import React from 'react';
import { HeritageDataItem } from '../../types';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from 'recharts';

interface ChartViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

type ChartSubType = 'bar' | 'line' | 'xy' | '3d';

const ChartView: React.FC<ChartViewProps> = ({ data, config, theme }) => {
  const chartType: ChartSubType = config.chartType || 'bar';
  const accentHex = theme.accentHex || '#2563eb';

  // Secondary color for multi-series
  const secondaryHex = shiftHue(accentHex);

  if (chartType === 'bar') {
    return renderBarChart(data, config, theme, accentHex);
  }
  if (chartType === 'line') {
    return renderLineChart(data, config, theme, accentHex, secondaryHex);
  }
  if (chartType === 'xy') {
    return renderXYChart(data, config, theme, accentHex);
  }
  if (chartType === '3d') {
    return renderBubbleChart(data, config, theme, accentHex);
  }

  return renderBarChart(data, config, theme, accentHex);
};

// --- Bar Chart (category counting or value-based) ---
function renderBarChart(data: HeritageDataItem[], config: any, theme: any, accentHex: string) {
  const categoryKey = config.categoryKey || 'category';
  const valueKey = config.valueKey;

  let chartData: { name: string; value: number }[];

  if (valueKey) {
    // Value-based: use actual column values
    const labelKey = config.labelKey || 'label';
    chartData = data
      .filter(item => item[valueKey] !== undefined && !isNaN(Number(item[valueKey])))
      .map(item => ({
        name: item[labelKey]?.toString() || 'Unknown',
        value: Number(item[valueKey])
      }));
  } else {
    // Category counting (original behavior)
    const counts = data.reduce((acc, item) => {
      const val = item[categoryKey]?.toString() || 'Uncategorized';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
  }

  return (
    <div className="h-full w-full p-10 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">
        {valueKey ? 'Value Comparison' : 'Distribution Analysis'}
      </h3>
      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
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
                {chartData.map((_entry, index) => (
                  <Cell key={index} fill={accentHex} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 italic text-sm">
            No data available for the selected columns.
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Total Records</div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">{valueKey ? 'Value Column' : 'Grouping By'}</div>
          <div className="text-lg font-bold truncate">"{valueKey || config.categoryKey || 'category'}"</div>
        </div>
      </div>
    </div>
  );
}

// --- Line Chart ---
function renderLineChart(data: HeritageDataItem[], config: any, theme: any, accentHex: string, secondaryHex: string) {
  const xKey = config.xKey || 'date';
  const yKeys: string[] = config.yKeys ? (Array.isArray(config.yKeys) ? config.yKeys : [config.yKeys]) : [];
  const labelKey = config.labelKey || 'label';

  if (yKeys.length === 0) {
    return (
      <div className="h-full w-full p-10 flex flex-col items-center justify-center">
        <p className="text-zinc-400 italic text-sm">Select at least one Y-axis column to display the line chart.</p>
      </div>
    );
  }

  const chartData = data
    .filter(item => item[xKey] !== undefined && !isNaN(Number(item[xKey])))
    .map(item => {
      const point: Record<string, any> = { x: Number(item[xKey]), label: item[labelKey] };
      yKeys.forEach(k => { point[k] = Number(item[k]) || 0; });
      return point;
    })
    .sort((a, b) => a.x - b.x);

  const colors = generateColors(accentHex, secondaryHex, yKeys.length);

  return (
    <div className="h-full w-full p-10 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">Trend Analysis</h3>
      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
                labelFormatter={(val) => `${xKey}: ${val}`}
              />
              {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              {yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: colors[i] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 italic text-sm">
            No numeric data found for column "{xKey}".
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Data Points</div>
          <div className="text-2xl font-bold">{chartData.length}</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">X Axis</div>
          <div className="text-lg font-bold truncate">"{xKey}"</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Series</div>
          <div className="text-lg font-bold truncate">{yKeys.length}</div>
        </div>
      </div>
    </div>
  );
}

// --- XY Scatter Chart ---
function renderXYChart(data: HeritageDataItem[], config: any, theme: any, accentHex: string) {
  const xKey = config.xKey || 'longitude';
  const yKey = config.yKey || 'latitude';
  const labelKey = config.labelKey || 'label';

  const chartData = data
    .filter(item =>
      item[xKey] !== undefined && !isNaN(Number(item[xKey])) &&
      item[yKey] !== undefined && !isNaN(Number(item[yKey]))
    )
    .map(item => ({
      x: Number(item[xKey]),
      y: Number(item[yKey]),
      label: item[labelKey]?.toString() || ''
    }));

  return (
    <div className="h-full w-full p-10 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">XY Scatter Plot</h3>
      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="x"
                type="number"
                name={xKey}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{ value: xKey, position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: 'currentColor', opacity: 0.5 } }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name={yKey}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{ value: yKey, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'currentColor', opacity: 0.5 } }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
                formatter={(value: any, name: string) => [value, name]}
                labelFormatter={(_: any) => ''}
                content={({ payload }: any) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg text-xs border">
                      <div className="font-bold mb-1">{d?.label}</div>
                      <div>{xKey}: {d?.x}</div>
                      <div>{yKey}: {d?.y}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={chartData} fill={accentHex} fillOpacity={0.7}>
                {chartData.map((_entry, index) => (
                  <Cell key={index} fill={accentHex} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 italic text-sm">
            No numeric data found for "{xKey}" and "{yKey}".
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Points</div>
          <div className="text-2xl font-bold">{chartData.length}</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">X Axis</div>
          <div className="text-lg font-bold truncate">"{xKey}"</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Y Axis</div>
          <div className="text-lg font-bold truncate">"{yKey}"</div>
        </div>
      </div>
    </div>
  );
}

// --- 3D Bubble Chart (scatter with Z-axis size) ---
function renderBubbleChart(data: HeritageDataItem[], config: any, theme: any, accentHex: string) {
  const xKey = config.xKey || 'longitude';
  const yKey = config.yKey || 'latitude';
  const zKey = config.zKey || 'date';
  const labelKey = config.labelKey || 'label';

  const chartData = data
    .filter(item =>
      item[xKey] !== undefined && !isNaN(Number(item[xKey])) &&
      item[yKey] !== undefined && !isNaN(Number(item[yKey])) &&
      item[zKey] !== undefined && !isNaN(Number(item[zKey]))
    )
    .map(item => ({
      x: Number(item[xKey]),
      y: Number(item[yKey]),
      z: Number(item[zKey]),
      label: item[labelKey]?.toString() || ''
    }));

  const zMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.z)) : 0;
  const zMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.z)) : 1;

  return (
    <div className="h-full w-full p-10 flex flex-col">
      <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-60">3D Bubble Chart</h3>
      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="x"
                type="number"
                name={xKey}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{ value: xKey, position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: 'currentColor', opacity: 0.5 } }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name={yKey}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{ value: yKey, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'currentColor', opacity: 0.5 } }}
              />
              <ZAxis
                dataKey="z"
                type="number"
                range={[60, 600]}
                domain={[zMin, zMax]}
                name={zKey}
              />
              <Tooltip
                content={({ payload }: any) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg text-xs border">
                      <div className="font-bold mb-1">{d?.label}</div>
                      <div>{xKey}: {d?.x}</div>
                      <div>{yKey}: {d?.y}</div>
                      <div>{zKey}: {d?.z}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={chartData} fill={accentHex} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 italic text-sm">
            No numeric data found for "{xKey}", "{yKey}", and "{zKey}".
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Points</div>
          <div className="text-2xl font-bold">{chartData.length}</div>
        </div>
        <div className="bg-black/5 p-4 rounded-xl border border-current/10">
          <div className="text-[10px] font-bold opacity-40 uppercase mb-1">Size Dimension</div>
          <div className="text-lg font-bold truncate">"{zKey}"</div>
        </div>
      </div>
    </div>
  );
}

// --- Color helpers ---
function shiftHue(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Rotate by roughly 120 degrees in a simple way
  return `#${b.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}`;
}

function generateColors(primary: string, secondary: string, count: number): string[] {
  if (count <= 1) return [primary];
  if (count === 2) return [primary, secondary];
  const colors = [primary, secondary];
  for (let i = 2; i < count; i++) {
    colors.push(shiftHue(colors[i - 1]));
  }
  return colors;
}

export default ChartView;
