
import React, { useState, useEffect } from 'react';
import { SiteConfig, HeritageDataItem } from './types.ts';
import { INITIAL_CONFIG, SAMPLE_DATA } from './constants.tsx';
import Editor from './components/Editor.tsx';
import Viewer from './components/Viewer.tsx';
import { Package, CheckCircle2, Loader2, Github, X, Download, RefreshCw, Trash2 } from 'lucide-react';
// @ts-ignore
import JSZip from 'https://esm.sh/jszip';

const App: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [data, setData] = useState<HeritageDataItem[]>(SAMPLE_DATA);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('polybius_config');
    const savedData = localStorage.getItem('polybius_data');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  const handleSave = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    localStorage.setItem('polybius_config', JSON.stringify(newConfig));
  };

  const handleDataUpdate = (newData: HeritageDataItem[]) => {
    setData(newData);
    localStorage.setItem('polybius_data', JSON.stringify(newData));
  };

  const handleClearAll = () => {
    setConfig(INITIAL_CONFIG);
    setData(SAMPLE_DATA);
    localStorage.removeItem('polybius_config');
    localStorage.removeItem('polybius_data');
    setShowClearConfirm(false);
    setMode('edit');
  };

  const handlePreviewClick = () => {
    if (mode === 'preview') {
      setViewerKey(k => k + 1);
    } else {
      setViewerKey(k => k + 1);
      setMode('preview');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const zip = new JSZip();

      // 1. Project Payload
      const sitePayload = JSON.stringify({ config, data }, null, 2);
      zip.file("site-data.json", sitePayload);

      // 2. The Standalone Runner HTML
      const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} | Polybius Export</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <style>
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .leaflet-container { width: 100%; height: 100%; background: transparent !important; }
        .dh-tooltip { background: white; border: 1px solid #ddd; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .mobile-viz { display: none; }
        @media (max-width: 767px) {
            .mobile-viz { display: block; }
            .desktop-viz { display: none !important; }
        }
    </style>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.2.4",
        "react-dom/client": "https://esm.sh/react-dom@19.2.4/client",
        "framer-motion": "https://esm.sh/framer-motion@12.29.2",
        "lucide-react": "https://esm.sh/lucide-react@0.463.0",
        "recharts": "https://esm.sh/recharts@3.7.0"
      }
    }
    </script>
</head>
<body>
    <div id="root"></div>

    <script type="module">
        import React, { useState, useEffect, useMemo, useRef } from 'react';
        import { createRoot } from 'react-dom/client';
        import { motion, AnimatePresence } from 'framer-motion';
        import * as Lucide from 'lucide-react';
        import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';

        // --- CONSTANTS & TYPES ---
        const THEMES = {
          classic: { bg: 'bg-white', text: 'text-gray-900', accent: 'bg-blue-600', font: 'font-sans', card: 'bg-gray-50 border-gray-200', headingColor: 'text-gray-900', accentHex: '#2563eb', cardShadow: 'shadow-xl' },
          parchment: { bg: 'bg-[#f4ead5]', text: 'text-[#432e1a]', accent: 'bg-[#8b4513]', font: 'font-serif', card: 'bg-[#ede0c8] border-[#d4c3a3]', headingColor: 'text-[#6b3410]', accentHex: '#8b4513', cardShadow: 'shadow-xl' },
          academic: { bg: 'bg-zinc-100', text: 'text-zinc-900', accent: 'bg-zinc-800', font: 'font-serif', card: 'bg-white border-zinc-300', headingColor: 'text-zinc-900', accentHex: '#27272a', cardShadow: 'shadow-xl' },
          dark: { bg: 'bg-zinc-950', text: 'text-zinc-100', accent: 'bg-amber-500', font: 'font-sans', card: 'bg-zinc-900 border-zinc-800', headingColor: 'text-amber-400', accentHex: '#f59e0b', cardShadow: 'shadow-lg ring-1 ring-white/5' },
          highcontrast: { bg: 'bg-white', text: 'text-black', accent: 'bg-blue-700', font: 'font-sans', card: 'bg-white border-black', headingColor: 'text-black', accentHex: '#1d4ed8', cardShadow: 'shadow-xl' },
          maritime: { bg: 'bg-[#0b1a2e]', text: 'text-[#c9daea]', accent: 'bg-[#d4a017]', font: 'font-serif', card: 'bg-[#122240] border-[#1e3a5f]', headingColor: 'text-[#e8b828]', accentHex: '#d4a017', cardShadow: 'shadow-lg ring-1 ring-white/5' },
          forest: { bg: 'bg-[#f0ebe3]', text: 'text-[#2d3a2e]', accent: 'bg-[#5a7247]', font: 'font-serif', card: 'bg-[#e8e0d4] border-[#c4b9a8]', headingColor: 'text-[#3d5230]', accentHex: '#5a7247', cardShadow: 'shadow-xl' },
          playful: { bg: 'bg-[#1a1025]', text: 'text-[#e8dff0]', accent: 'bg-[#e85d75]', font: 'font-sans', card: 'bg-[#251438]/80 border-[#3d2655]', headingColor: 'text-[#f0a1b3]', accentHex: '#e85d75', cardShadow: 'shadow-lg ring-1 ring-white/5' }
        };

        // --- SUB-COMPONENTS ---
        function buildEventSlots(sortedData, dateKey) {
            const groups = new Map();
            for (const item of sortedData) {
                const d = Number(item[dateKey]);
                const arr = groups.get(d) || [];
                arr.push(item);
                groups.set(d, arr);
            }
            const slots = [];
            let slotIndex = 0;
            const sortedDates = [...groups.keys()].sort((a, b) => a - b);
            for (const date of sortedDates) {
                const items = groups.get(date);
                items.forEach((item, i) => {
                    slots.push({ item, slotIndex, isFirstInGroup: i === 0, groupSize: items.length, date });
                    slotIndex++;
                });
            }
            return slots;
        }

        const TimelineView = ({ data, config, theme }) => {
            const dateKey = config.dateKey || 'date';
            const labelKey = config.labelKey || 'label';
            const orientation = config.orientation || 'vertical';
            const sortedData = [...data]
                .filter(d => d[dateKey] !== undefined && !isNaN(Number(d[dateKey])))
                .sort((a, b) => Number(a[dateKey]) - Number(b[dateKey]));

            if (sortedData.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No temporal data found.");

            const minDate = Number(sortedData[0][dateKey]);
            const maxDate = Number(sortedData[sortedData.length - 1][dateKey]);
            const slots = buildEventSlots(sortedData, dateKey);
            const totalSlots = slots.length;

            if (orientation === 'vertical') {
                const rowHeight = 64;
                return React.createElement('div', { className: "h-full w-full p-12 flex flex-col" }, [
                    React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Temporal Progression"),
                    React.createElement('div', { key: 'body', className: "flex-1 overflow-y-auto relative", style: { scrollbarWidth: 'thin' } },
                        React.createElement('div', { className: "relative pl-8", style: { minHeight: Math.max(totalSlots * rowHeight, 300) + 'px' } }, [
                            React.createElement('div', { key: 'axis', className: "absolute top-0 bottom-0 left-6 w-px bg-current opacity-20" }),
                            ...slots.map(({ item, slotIndex, isFirstInGroup, groupSize, date }, arrIdx) =>
                                React.createElement('div', { key: arrIdx, className: "absolute flex items-center group", style: { top: (slotIndex * rowHeight) + 'px', left: 0 } }, [
                                    isFirstInGroup && groupSize > 1 && React.createElement('div', { key: 'bracket', className: "absolute left-[23px] border-l-2 border-dashed opacity-20", style: { borderColor: theme.accentHex, top: '6px', height: ((groupSize - 1) * rowHeight) + 'px' } }),
                                    React.createElement('div', { key: 'dot', className: "rounded-full " + theme.accent + " shadow-lg relative z-10", style: { marginLeft: '18px', width: isFirstInGroup ? 12 : 8, height: isFirstInGroup ? 12 : 8 } }),
                                    React.createElement('div', { key: 'label', className: "ml-6 flex items-baseline gap-3" }, [
                                        isFirstInGroup
                                            ? React.createElement('span', { key: 'd', className: "text-sm font-bold min-w-[60px]" }, date)
                                            : React.createElement('span', { key: 'd', className: "text-[10px] opacity-30 min-w-[60px] italic" }, "same date"),
                                        React.createElement('span', { key: 'l', className: "text-xs opacity-70" }, item[labelKey] || 'Untitled')
                                    ])
                                ])
                            )
                        ])
                    ),
                    React.createElement('div', { key: 'footer', className: "mt-auto flex justify-between text-[10px] font-bold opacity-40 uppercase" }, [
                        React.createElement('span', { key: 's' }, "Start: " + minDate),
                        React.createElement('span', { key: 'c' }, "Column: " + dateKey),
                        React.createElement('span', { key: 'e' }, "End: " + maxDate)
                    ])
                ]);
            }

            // Horizontal
            const minSpacingPx = 110;
            const minWidthNeeded = totalSlots * minSpacingPx;
            const innerWidth = minWidthNeeded > 600 ? Math.max(minWidthNeeded, 100) + 'px' : '100%';
            return React.createElement('div', { className: "h-full w-full p-12 flex flex-col" }, [
                React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Temporal Progression"),
                React.createElement('div', { key: 'body', className: "relative flex-1 overflow-x-auto overflow-y-hidden", style: { scrollbarWidth: 'thin' } },
                    React.createElement('div', { className: "relative h-full", style: { minWidth: innerWidth } }, [
                        React.createElement('div', { key: 'axis', className: "absolute top-1/2 left-[2%] right-[2%] h-px bg-current opacity-20" }),
                        React.createElement('div', { key: 'pts', className: "h-full relative flex items-center" },
                            slots.map(({ item, slotIndex, isFirstInGroup, date }, arrIdx) => {
                                const pos = totalSlots > 1 ? 2 + (slotIndex / (totalSlots - 1)) * 96 : 50;
                                const isTop = arrIdx % 2 === 0;
                                const dateDisplay = isFirstInGroup ? String(date) : '\\u21b3';
                                const labelEl = React.createElement('div', { key: 'lbl', className: (isTop ? "mb-4 pb-4" : "mt-4 pt-4") + " text-center", style: { width: Math.max(80, minSpacingPx - 20) + 'px' } }, [
                                    React.createElement('span', { key: 'd', className: "text-sm font-bold block " + (!isFirstInGroup ? 'opacity-40 text-xs' : '') }, dateDisplay),
                                    React.createElement('span', { key: 'l', className: "text-xs opacity-70 block truncate px-1" }, item[labelKey] || 'Untitled')
                                ]);
                                return React.createElement('div', { key: arrIdx, className: "absolute flex flex-col items-center group", style: { left: pos + '%', transform: 'translateX(-50%)' } }, [
                                    isTop && labelEl,
                                    React.createElement('div', { key: 'dot', className: "rounded-full " + theme.accent + " shadow-lg", style: { width: isFirstInGroup ? 12 : 8, height: isFirstInGroup ? 12 : 8 } }),
                                    !isTop && labelEl
                                ]);
                            })
                        )
                    ])
                ),
                React.createElement('div', { key: 'footer', className: "mt-auto flex justify-between text-[10px] font-bold opacity-40 uppercase" }, [
                    React.createElement('span', { key: 's' }, "Start: " + minDate),
                    React.createElement('span', { key: 'c' }, "Column: " + dateKey),
                    React.createElement('span', { key: 'e' }, "End: " + maxDate)
                ])
            ]);
        };

        const MapView = ({ data, config, theme }) => {
            const mapRef = useRef(null);
            const mapInstance = useRef(null);
            const layerGroup = useRef(null);
            const tileRef = useRef(null);

            useEffect(() => {
                if (!mapRef.current) return;
                const L = window.L;
                if (!mapInstance.current) {
                    mapInstance.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
                    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
                    layerGroup.current = L.layerGroup().addTo(mapInstance.current);
                }

                const map = mapInstance.current;
                const layers = layerGroup.current;
                layers.clearLayers();

                if (tileRef.current) { map.removeLayer(tileRef.current); }
                const baseMaps = {
                    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    toner: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
                    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                    watercolour: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'
                };
                const tileUrl = baseMaps[config.baseMap] || baseMaps.terrain;
                tileRef.current = L.tileLayer(tileUrl).addTo(map);

                const latKey = config.latKey || 'latitude';
                const lngKey = config.lngKey || 'longitude';
                const labelKey = config.labelKey || 'label';

                const markers = [];
                data.filter(d => !isNaN(d[latKey]) && !isNaN(d[lngKey])).forEach(point => {
                    const m = L.circleMarker([point[latKey], point[lngKey]], {
                        radius: 6, fillColor: theme.accentHex || '#4f46e5', color: '#fff', weight: 1, fillOpacity: 0.8
                    }).bindTooltip(point[labelKey]?.toString() || "Untitled", { className: 'dh-tooltip' });
                    m.addTo(layers);
                    markers.push(m);
                });

                const hasDefault = config.defaultLat && config.defaultLng && config.defaultZoom;
                if (hasDefault) {
                    map.setView([parseFloat(config.defaultLat), parseFloat(config.defaultLng)], parseInt(config.defaultZoom));
                } else if (markers.length > 0) {
                    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
                }
            }, [data, config]);

            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { key: 'h', className: "p-8 font-bold uppercase opacity-60" }, "Spatial Context"),
                React.createElement('div', { key: 'm', ref: mapRef, className: "flex-1 m-8 mt-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-inner" })
            ]);
        };

        function shiftHueExport(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return '#' + b.toString(16).padStart(2, '0') + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0');
        }
        function genColorsExport(primary, secondary, count) {
            if (count <= 1) return [primary];
            if (count === 2) return [primary, secondary];
            const c = [primary, secondary];
            for (let i = 2; i < count; i++) c.push(shiftHueExport(c[i - 1]));
            return c;
        }

        const ChartView = ({ data, config, theme }) => {
            const chartType = config.chartType || 'bar';
            const accentHex = theme.accentHex || '#2563eb';
            const secondaryHex = shiftHueExport(accentHex);
            const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' };

            if (chartType === 'bar' || (!chartType)) {
                const categoryKey = config.categoryKey || 'category';
                const valueKey = config.valueKey;
                let chartData;
                if (valueKey) {
                    const labelKey = config.labelKey || 'label';
                    chartData = data.filter(item => item[valueKey] !== undefined && !isNaN(Number(item[valueKey]))).map(item => ({ name: item[labelKey]?.toString() || 'Unknown', value: Number(item[valueKey]) }));
                } else {
                    const counts = data.reduce((acc, item) => { const val = item[categoryKey]?.toString() || 'Uncategorized'; acc[val] = (acc[val] || 0) + 1; return acc; }, {});
                    chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
                }
                return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                    React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, valueKey ? "Value Comparison" : "Distribution Analysis"),
                    React.createElement('div', { key: 'chart', className: "flex-1 w-full" },
                        chartData.length > 0 ? React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                            React.createElement(BarChart, { data: chartData, layout: "vertical", margin: { left: 20 } }, [
                                React.createElement(CartesianGrid, { key: 'grid', strokeDasharray: "3 3", opacity: 0.1, horizontal: false }),
                                React.createElement(XAxis, { key: 'x', type: "number", hide: true }),
                                React.createElement(YAxis, { key: 'y', dataKey: "name", type: "category", width: 100, axisLine: false, tickLine: false, tick: { fill: 'currentColor', fontSize: 10, fontWeight: 'bold' } }),
                                React.createElement(Tooltip, { key: 'tip', cursor: { fill: 'rgba(0,0,0,0.05)' }, contentStyle: tooltipStyle }),
                                React.createElement(Bar, { key: 'bar', dataKey: "value", radius: [0, 4, 4, 0] },
                                    chartData.map((e, i) => React.createElement(Cell, { key: i, fill: accentHex, fillOpacity: 0.8 }))
                                )
                            ])
                        ) : React.createElement('div', { className: "h-full flex items-center justify-center opacity-40 italic text-sm" }, "No data available.")
                    )
                ]);
            }

            if (chartType === 'line') {
                const xKey = config.xKey || 'date';
                const yKeys = config.yKeys ? (Array.isArray(config.yKeys) ? config.yKeys : [config.yKeys]) : [];
                if (yKeys.length === 0) return React.createElement('div', { className: "h-full w-full p-10 flex items-center justify-center opacity-40 italic text-sm" }, "Select Y-axis columns.");
                const chartData = data.filter(item => item[xKey] !== undefined && !isNaN(Number(item[xKey]))).map(item => {
                    const pt = { x: Number(item[xKey]) };
                    yKeys.forEach(k => { pt[k] = Number(item[k]) || 0; });
                    return pt;
                }).sort((a, b) => a.x - b.x);
                const colors = genColorsExport(accentHex, secondaryHex, yKeys.length);
                return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                    React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Trend Analysis"),
                    React.createElement('div', { key: 'chart', className: "flex-1 w-full" },
                        chartData.length > 0 ? React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                            React.createElement(LineChart, { data: chartData, margin: { top: 10, right: 20, bottom: 10, left: 10 } }, [
                                React.createElement(CartesianGrid, { key: 'grid', strokeDasharray: "3 3", opacity: 0.15 }),
                                React.createElement(XAxis, { key: 'x', dataKey: "x", type: "number", domain: ['dataMin', 'dataMax'], tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(YAxis, { key: 'y', tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(Tooltip, { key: 'tip', contentStyle: tooltipStyle, labelFormatter: (val) => xKey + ': ' + val }),
                                yKeys.length > 1 && React.createElement(Legend, { key: 'legend', wrapperStyle: { fontSize: '10px' } }),
                                ...yKeys.map((k, i) => React.createElement(Line, { key: k, type: "monotone", dataKey: k, stroke: colors[i], strokeWidth: 2, dot: { r: 4, fill: colors[i] }, activeDot: { r: 6 } }))
                            ])
                        ) : React.createElement('div', { className: "h-full flex items-center justify-center opacity-40 italic text-sm" }, "No numeric data for " + xKey)
                    )
                ]);
            }

            if (chartType === 'xy') {
                const xKey = config.xKey || 'longitude';
                const yKey = config.yKey || 'latitude';
                const labelKey = config.labelKey || 'label';
                const chartData = data.filter(item => item[xKey] !== undefined && !isNaN(Number(item[xKey])) && item[yKey] !== undefined && !isNaN(Number(item[yKey]))).map(item => ({ x: Number(item[xKey]), y: Number(item[yKey]), label: item[labelKey]?.toString() || '' }));
                return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                    React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, "XY Scatter Plot"),
                    React.createElement('div', { key: 'chart', className: "flex-1 w-full" },
                        chartData.length > 0 ? React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                            React.createElement(ScatterChart, { margin: { top: 10, right: 20, bottom: 20, left: 10 } }, [
                                React.createElement(CartesianGrid, { key: 'grid', strokeDasharray: "3 3", opacity: 0.15 }),
                                React.createElement(XAxis, { key: 'x', dataKey: "x", type: "number", domain: ['dataMin', 'dataMax'], name: xKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(YAxis, { key: 'y', dataKey: "y", type: "number", domain: ['dataMin', 'dataMax'], name: yKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(Tooltip, { key: 'tip', content: ({ payload }) => {
                                    if (!payload || payload.length === 0) return null;
                                    const d = payload[0]?.payload;
                                    return React.createElement('div', { className: "bg-white p-3 rounded-xl shadow-lg text-xs border" }, [
                                        React.createElement('div', { key: 'l', className: "font-bold mb-1" }, d?.label),
                                        React.createElement('div', { key: 'x' }, xKey + ': ' + d?.x),
                                        React.createElement('div', { key: 'y' }, yKey + ': ' + d?.y)
                                    ]);
                                }}),
                                React.createElement(Scatter, { key: 'scatter', data: chartData, fill: accentHex, fillOpacity: 0.7 },
                                    chartData.map((e, i) => React.createElement(Cell, { key: i, fill: accentHex }))
                                )
                            ])
                        ) : React.createElement('div', { className: "h-full flex items-center justify-center opacity-40 italic text-sm" }, "No numeric data for " + xKey + " and " + yKey)
                    )
                ]);
            }

            if (chartType === '3d') {
                const xKey = config.xKey || 'longitude';
                const yKey = config.yKey || 'latitude';
                const zKey = config.zKey || 'date';
                const labelKey = config.labelKey || 'label';
                const chartData = data.filter(item => item[xKey] !== undefined && !isNaN(Number(item[xKey])) && item[yKey] !== undefined && !isNaN(Number(item[yKey])) && item[zKey] !== undefined && !isNaN(Number(item[zKey]))).map(item => ({ x: Number(item[xKey]), y: Number(item[yKey]), z: Number(item[zKey]), label: item[labelKey]?.toString() || '' }));
                const zMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.z)) : 0;
                const zMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.z)) : 1;
                return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                    React.createElement('h3', { key: 'title', className: "text-xl font-bold mb-8 uppercase opacity-60" }, "3D Bubble Chart"),
                    React.createElement('div', { key: 'chart', className: "flex-1 w-full" },
                        chartData.length > 0 ? React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                            React.createElement(ScatterChart, { margin: { top: 10, right: 20, bottom: 20, left: 10 } }, [
                                React.createElement(CartesianGrid, { key: 'grid', strokeDasharray: "3 3", opacity: 0.15 }),
                                React.createElement(XAxis, { key: 'x', dataKey: "x", type: "number", domain: ['dataMin', 'dataMax'], name: xKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(YAxis, { key: 'y', dataKey: "y", type: "number", domain: ['dataMin', 'dataMax'], name: yKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(ZAxis, { key: 'z', dataKey: "z", type: "number", range: [60, 600], domain: [zMin, zMax], name: zKey }),
                                React.createElement(Tooltip, { key: 'tip', content: ({ payload }) => {
                                    if (!payload || payload.length === 0) return null;
                                    const d = payload[0]?.payload;
                                    return React.createElement('div', { className: "bg-white p-3 rounded-xl shadow-lg text-xs border" }, [
                                        React.createElement('div', { key: 'l', className: "font-bold mb-1" }, d?.label),
                                        React.createElement('div', { key: 'x' }, xKey + ': ' + d?.x),
                                        React.createElement('div', { key: 'y' }, yKey + ': ' + d?.y),
                                        React.createElement('div', { key: 'z' }, zKey + ': ' + d?.z)
                                    ]);
                                }}),
                                React.createElement(Scatter, { key: 'scatter', data: chartData, fill: accentHex, fillOpacity: 0.6 })
                            ])
                        ) : React.createElement('div', { className: "h-full flex items-center justify-center opacity-40 italic text-sm" }, "No numeric data for " + xKey + ", " + yKey + ", " + zKey)
                    )
                ]);
            }

            return React.createElement('div', { className: "h-full w-full p-10 flex items-center justify-center opacity-40" }, "Unknown chart type.");
        };

        function buildEdgesExport(data, connectionsKey, labelKey) {
            const edgeMap = new Map();
            data.forEach((item, idx) => {
                const raw = item[connectionsKey];
                const conns = typeof raw === 'string' ? raw.split(';').map(s => s.trim()).filter(Boolean) : raw;
                if (!Array.isArray(conns)) return;
                conns.forEach(targetId => {
                    const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
                    if (targetIdx === -1 || targetIdx === idx) return;
                    const a = Math.min(idx, targetIdx), b = Math.max(idx, targetIdx);
                    const key = a + '-' + b;
                    const existing = edgeMap.get(key);
                    if (existing) existing.weight += 1;
                    else edgeMap.set(key, { source: a, target: b, weight: 1 });
                });
            });
            return [...edgeMap.values()];
        }

        function forceLayoutExport(data, edges, w, h) {
            const n = data.length;
            if (n === 0) return [];
            const k = Math.sqrt(w * h / n) * 0.85;
            const cx = w / 2, cy = h / 2;
            const positions = data.map((_, i) => {
                const angle = (2 * Math.PI * i) / n;
                const r = Math.min(w, h) * 0.35;
                return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
            });
            let temp = Math.min(w, h) * 0.15;
            for (let iter = 0; iter < 200; iter++) {
                const disp = positions.map(() => ({ x: 0, y: 0 }));
                for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
                    const dx = positions[i].x - positions[j].x, dy = positions[i].y - positions[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    const f = (k * k) / dist;
                    disp[i].x += (dx / dist) * f; disp[i].y += (dy / dist) * f;
                    disp[j].x -= (dx / dist) * f; disp[j].y -= (dy / dist) * f;
                }
                for (const { source, target, weight } of edges) {
                    const dx = positions[source].x - positions[target].x, dy = positions[source].y - positions[target].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    const f = (dist * dist) / k * (0.5 + weight * 0.5);
                    disp[source].x -= (dx / dist) * f; disp[source].y -= (dy / dist) * f;
                    disp[target].x += (dx / dist) * f; disp[target].y += (dy / dist) * f;
                }
                for (let i = 0; i < n; i++) {
                    disp[i].x -= (positions[i].x - cx) * 0.02;
                    disp[i].y -= (positions[i].y - cy) * 0.02;
                }
                for (let i = 0; i < n; i++) {
                    const dist = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y) || 0.01;
                    const ld = Math.min(dist, temp);
                    positions[i].x += (disp[i].x / dist) * ld;
                    positions[i].y += (disp[i].y / dist) * ld;
                    positions[i].x = Math.max(50, Math.min(w - 50, positions[i].x));
                    positions[i].y = Math.max(50, Math.min(h - 50, positions[i].y));
                }
                temp = Math.max(0.5, temp * 0.97);
            }
            return positions;
        }

        const NetworkView = ({ data, config, theme }) => {
    const connectionsKey = config.connectionsKey || 'connections';
    const labelKey = config.labelKey || 'label';
    const initialMinWeight = config.minWeight || 1;
    const svgW = 600, svgH = 500;

    const [hoveredNode, setHoveredNode] = useState(null);
    const [minWeight, setMinWeight] = useState(initialMinWeight);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: svgW, h: svgH });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            setViewBox(v => ({ x: v.x + (v.w - v.w * scale) / 2, y: v.y + (v.h - v.h * scale) / 2, w: v.w * scale, h: v.h * scale }));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const edges = useMemo(() => buildEdgesExport(data, connectionsKey, labelKey), [data, connectionsKey, labelKey]);
    const filteredEdges = useMemo(() => edges.filter(e => e.weight >= minWeight), [edges, minWeight]);
    const positions = useMemo(() => forceLayoutExport(data, filteredEdges, svgW, svgH), [data, filteredEdges]);

    const degrees = useMemo(() => {
        const d = new Array(data.length).fill(0);
        filteredEdges.forEach(e => { d[e.source] += e.weight; d[e.target] += e.weight; });
        return d;
    }, [filteredEdges, data.length]);

    const maxDeg = Math.max(...degrees, 1);
    const maxWeight = Math.max(...edges.map(e => e.weight), 1);

    const connectedToHover = useMemo(() => {
        if (hoveredNode === null) return new Set();
        const neighbors = new Set([hoveredNode]);
        filteredEdges.forEach(e => {
            if (e.source === hoveredNode) neighbors.add(e.target);
            if (e.target === hoveredNode) neighbors.add(e.source);
        });
        return neighbors;
    }, [hoveredNode, filteredEdges]);

    return React.createElement('div', { className: "h-full w-full p-6 flex flex-col" }, [
        React.createElement('div', { key: 'hdr', className: "flex justify-between items-center mb-4" }, [
            React.createElement('h3', { className: "text-lg font-bold uppercase opacity-60" }, "Relational Network"),
            React.createElement('button', { onClick: () => setViewBox({ x: 0, y: 0, w: svgW, h: svgH }), className: "text-[10px] font-bold uppercase p-2 hover:bg-current/10 rounded" }, "Reset View"),
            maxWeight > 1 && React.createElement('div', { className: "flex items-center gap-3 bg-current/5 px-3 py-1 rounded-full" }, [
                React.createElement('label', { className: "text-[9px] font-black uppercase opacity-50" }, "Min Weight:"),
                React.createElement('input', { type: "range", min: 1, max: maxWeight, step: 1, value: minWeight, onChange: e => setMinWeight(Number(e.target.value)), className: "w-24 h-1 accent-current" }),
                React.createElement('span', { className: "text-[10px] font-bold min-w-[12px]" }, minWeight)
            ])
        ]),
        React.createElement('div', { key: 'svg-cont', ref: containerRef, className: "flex-1 relative bg-current/[0.02] rounded-3xl border border-current/10 overflow-hidden" },
            React.createElement('svg', { ref: svgRef, viewBox: viewBox.x + " " + viewBox.y + " " + viewBox.w + " " + viewBox.h, className: "w-full h-full touch-none",
                onMouseDown: e => { setIsPanning(true); panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y }; },
                onMouseMove: e => { if (!isPanning) return; const dx = (e.clientX - panStart.current.x) * (viewBox.w / svgRef.current.clientWidth); const dy = (e.clientY - panStart.current.y) * (viewBox.h / svgRef.current.clientHeight); setViewBox(v => ({ ...v, x: panStart.current.vx - dx, y: panStart.current.vy - dy })); },
                onMouseUp: () => setIsPanning(false),
                onMouseLeave: () => { setIsPanning(false); setHoveredNode(null); }
            }, [
                // Edges
                ...filteredEdges.map((edge, i) => {
                    const isDimmed = hoveredNode !== null && !connectedToHover.has(edge.source) && !connectedToHover.has(edge.target);
                    const isHighlighted = hoveredNode !== null && (edge.source === hoveredNode || edge.target === hoveredNode);
                    return React.createElement('line', {
                        key: 'e'+i,
                        x1: positions[edge.source].x, y1: positions[edge.source].y,
                        x2: positions[edge.target].x, y2: positions[edge.target].y,
                        stroke: theme.accentHex,
                        strokeWidth: isHighlighted ? 3 : 1 + (edge.weight * 0.5),
                        opacity: isDimmed ? 0.05 : isHighlighted ? 0.8 : 0.2,
                        strokeLinecap: "round",
                        className: "transition-all duration-300"
                    });
                }),
                // Nodes
                ...data.map((item, i) => {
                    if (degrees[i] === 0 && minWeight > 1) return null;
                    const { x, y } = positions[i];
                    const r = 5 + (degrees[i] / maxDeg) * 15;
                    const isDimmed = hoveredNode !== null && !connectedToHover.has(i);
                    return React.createElement('g', { 
                        key: 'n'+i, 
                        onMouseEnter: () => setHoveredNode(i), 
                        onMouseLeave: () => setHoveredNode(null),
                        className: "cursor-pointer transition-opacity duration-300",
                        style: { opacity: isDimmed ? 0.2 : 1 }
                    }, [
                        React.createElement('circle', { cx: x, cy: y, r: r, fill: theme.accentHex }),
                        React.createElement('text', { x: x, y: y + r + 14, textAnchor: "middle", fontSize: "10", fontWeight: "bold", className: "fill-current" }, [
                            React.createElement('tspan', { x: x, dy: "0", stroke: theme.bg.includes('white') || theme.bg.includes('zinc-100') ? "white" : "black", strokeWidth: "3", strokeLinejoin: "round", opacity: 0.8 }, item[labelKey]),
                            React.createElement('tspan', { x: x, dy: "0", fill: "currentColor" }, item[labelKey])
                        ])
                    ]);
                })
            ])
        )
    ]);
};

        const ImageView = ({ data, config, theme }) => {
            const imageKey = config.imageKey || 'imageUrl';
            const labelKey = config.labelKey || 'label';
            const descKey = config.descriptionKey || 'description';
            const selectedIds = config.selectedItemIds;
            const allImageItems = data.filter(d => d[imageKey]);
            const items = selectedIds && selectedIds.length > 0
              ? allImageItems.filter(d => selectedIds.includes(String(d.id)))
              : allImageItems;
            const [activeIndex, setActiveIndex] = useState(0);

            if (items.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No image data found.");

            const activeItem = items[activeIndex];
            const imageUrl = activeItem[imageKey];
            const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
            const resolvedUrl = isIIIF && !imageUrl.match(/\\.(jpg|jpeg|png|gif|webp)/i)
              ? imageUrl.replace(/\\/$/, '') + '/full/800,/0/default.jpg'
              : imageUrl;
            const goNext = () => setActiveIndex(p => (p + 1) % items.length);
            const goPrev = () => setActiveIndex(p => (p - 1 + items.length) % items.length);

            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { key: 'hdr', className: "p-8 pb-0 flex items-center justify-between" }, [
                    React.createElement('h3', { key: 'h', className: "text-xl font-bold uppercase opacity-60" }, "Gallery"),
                    React.createElement('span', { key: 'c', className: "text-xs font-bold opacity-40" }, (activeIndex + 1) + " / " + items.length)
                ]),
                React.createElement('div', { key: 'body', className: "flex-1 p-8 flex flex-col min-h-0" }, [
                    React.createElement('div', { key: 'img', className: "flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0" }, [
                        React.createElement('img', { key: 'i', src: resolvedUrl, alt: activeItem[labelKey] || 'Image', className: "w-full h-full object-contain" }),
                        items.length > 1 && React.createElement('button', { key: 'prev', onClick: goPrev, className: "absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-70 hover:opacity-100", style: { backdropFilter: 'blur(4px)' } }, React.createElement(Lucide.ChevronLeft, { size: 20 })),
                        items.length > 1 && React.createElement('button', { key: 'next', onClick: goNext, className: "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-70 hover:opacity-100", style: { backdropFilter: 'blur(4px)' } }, React.createElement(Lucide.ChevronRight, { size: 20 }))
                    ]),
                    React.createElement('div', { key: 'cap', className: "mt-4 text-center" }, [
                        React.createElement('p', { key: 'l', className: "text-sm font-bold" }, activeItem[labelKey] || 'Untitled'),
                        activeItem[descKey] && React.createElement('p', { key: 'd', className: "text-xs opacity-70 mt-1" }, activeItem[descKey])
                    ]),
                    items.length > 1 && React.createElement('div', { key: 'thumbs', className: "mt-4 flex items-center justify-center gap-2" },
                        items.map((item, idx) => React.createElement('button', {
                            key: idx, onClick: () => setActiveIndex(idx),
                            className: "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all " + (idx === activeIndex ? 'border-current opacity-100' : 'border-transparent opacity-40')
                        }, React.createElement('img', { src: item[imageKey], alt: '', className: "w-full h-full object-cover" })))
                    )
                ])
            ]);
        };

        const SingleImageView = ({ data, config, theme }) => {
            const imageKey = config.imageKey || 'imageUrl';
            const labelKey = config.labelKey || 'label';
            const descKey = config.descriptionKey || 'description';
            const itemId = config.itemId ?? '';
            const items = data.filter(d => d[imageKey]);

            if (items.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No image data found.");

            let item;
            if (itemId) {
                const needle = String(itemId).toLowerCase();
                item = items.find(d => String(d.id).toLowerCase() === needle);
            }
            if (!item) {
                const legacyIndex = config.itemIndex ?? 0;
                item = items[Math.min(legacyIndex, items.length - 1)];
            }
            const imageUrl = item[imageKey];
            const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
            const resolvedUrl = isIIIF && !imageUrl.match(/\\.(jpg|jpeg|png|gif|webp)/i)
              ? imageUrl.replace(/\\/$/, '') + '/full/800,/0/default.jpg'
              : imageUrl;

            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { key: 'hdr', className: "p-8 pb-0" },
                    React.createElement('h3', { className: "text-xl font-bold uppercase opacity-60" }, "Image")
                ),
                React.createElement('div', { key: 'body', className: "flex-1 p-8 flex flex-col min-h-0" }, [
                    React.createElement('div', { key: 'img', className: "flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0" },
                        React.createElement('img', { src: resolvedUrl, alt: item[labelKey] || 'Image', className: "w-full h-full object-contain" })
                    ),
                    React.createElement('div', { key: 'cap', className: "mt-4 text-center" }, [
                        React.createElement('p', { key: 'l', className: "text-sm font-bold" }, item[labelKey] || 'Untitled'),
                        item[descKey] && React.createElement('p', { key: 'd', className: "text-xs opacity-70 mt-1" }, item[descKey])
                    ])
                ]),
                React.createElement('div', { key: 'foot', className: "px-8 pb-4 text-[10px] font-bold opacity-40 uppercase" }, "Source: " + imageKey + " \\u00B7 ID: " + (item.id || 'n/a'))
            ]);
        };

        // --- VIDEO EMBED HELPER ---
        function parseVideoEmbeds(text) {
            const urlRegex = /(https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|vimeo\\.com\\/)([\\w-]+)[^\\s]*)/gi;
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = urlRegex.exec(text)) !== null) {
                if (match.index > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
                const fullUrl = match[1], videoId = match[2];
                let embedUrl = '';
                if (fullUrl.includes('youtube.com') || fullUrl.includes('youtu.be')) embedUrl = 'https://www.youtube.com/embed/' + videoId;
                else if (fullUrl.includes('vimeo.com')) embedUrl = 'https://player.vimeo.com/video/' + videoId;
                parts.push({ type: 'video', content: fullUrl, embedUrl });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
            return parts.length > 0 ? parts : [{ type: 'text', content: text }];
        }

        function renderTextWithEmbeds(text) {
            const parts = parseVideoEmbeds(text);
            const hasVideos = parts.some(p => p.type === 'video');
            if (!hasVideos) return React.createElement('p', { className: "text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap opacity-90" }, text);
            return React.createElement('div', { className: "space-y-6" }, parts.map((part, i) => {
                if (part.type === 'video' && part.embedUrl) {
                    return React.createElement('div', { key: i, className: "relative w-full rounded-xl overflow-hidden shadow-lg", style: { paddingBottom: '56.25%', zIndex: 0, isolation: 'isolate' } },
                        React.createElement('iframe', { src: part.embedUrl, className: "absolute inset-0 w-full h-full", style: { zIndex: 0 }, allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, title: "Embedded video" })
                    );
                }
                if (part.content.trim()) return React.createElement('p', { key: i, className: "text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap opacity-90" }, part.content);
                return null;
            }));
        }

        // --- VIEWER ENGINE ---
        const Viewer = ({ config, data }) => {
            const theme = THEMES[config.theme] || THEMES.classic;
            const [activeId, setActiveId] = useState(config.sections[0]?.id || '');
            const sectionRefs = useRef({});

            useEffect(() => {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(e => {
                        if (e.isIntersecting && e.intersectionRatio >= 0.5) setActiveId(e.target.dataset.id);
                    });
                }, { threshold: [0.1, 0.5, 0.9], rootMargin: '-10% 0px -10% 0px' });
                Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
                return () => observer.disconnect();
            }, []);

            const activeSection = config.sections.find(s => s.id === activeId);
            const isTextActive = activeSection && activeSection.cardType === 'TEXT';

            const renderViz = () => {
                if (!activeSection) return null;
                if (activeSection.cardType === 'TEXT') return null;
                if (activeSection.cardType === 'MAP') return React.createElement(MapView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'TIMELINE') return React.createElement(TimelineView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'STATISTICS') return React.createElement(ChartView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'NETWORK') return React.createElement(NetworkView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'GALLERY') return React.createElement(ImageView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'IMAGE') return React.createElement(SingleImageView, { data, config: activeSection.config, theme });
                return React.createElement('div', { className: "p-20 text-center opacity-30" }, "Visualization type not supported.");
            };

            const vizAlignCls = activeSection && activeSection.vizAlignment === 'left' ? 'justify-start' : activeSection && activeSection.vizAlignment === 'right' ? 'justify-end' : 'justify-center';

            return React.createElement('div', { className: "min-h-screen transition-colors duration-700 " + theme.bg + " " + theme.text + " " + theme.font }, [
                React.createElement('style', { key: 'sel' }, "::selection { background-color: " + theme.accentHex + "33; }"),
                React.createElement('header', { key: 'hdr', className: "h-[50vh] md:h-[70vh] flex flex-col items-center justify-center text-center px-4 md:px-6 relative overflow-hidden" }, [
                    config.theme === 'playful' && React.createElement('div', { key: 'ghost', className: "absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none", 'aria-hidden': true },
                        React.createElement('div', { className: "relative w-full h-full overflow-hidden" },
                            [0, 1, 2, 3, 4].map(function(i) {
                                return React.createElement('div', {
                                    key: 'g' + i,
                                    className: "absolute whitespace-nowrap font-bold",
                                    style: {
                                        fontSize: (8 + i * 3) + 'rem',
                                        top: (10 + i * 18) + '%',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(' + (-3 + i * 1.5) + 'deg)',
                                        opacity: 0.03 + i * 0.008,
                                        color: theme.accentHex,
                                        letterSpacing: (0.05 + i * 0.02) + 'em',
                                        lineHeight: 1
                                    }
                                }, config.title);
                            })
                        )
                    ),
                    React.createElement('h1', { key: 'title', className: "text-3xl sm:text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight relative z-10" }, config.title),
                    React.createElement('div', { key: 'line', className: "h-1 w-24 rounded-full mx-auto mt-2 mb-4 md:mb-6", style: { backgroundColor: theme.accentHex } }),
                    React.createElement('p', { key: 'sub', className: "text-base sm:text-xl md:text-2xl opacity-80 italic max-w-2xl mb-6 md:mb-0" }, config.subtitle),
                    React.createElement('div', { key: 'auth', className: "mt-6 md:mt-8 flex flex-col items-center" }, [
                        React.createElement('span', { key: 'by', className: "text-xs font-bold uppercase tracking-widest opacity-50" }, "Authored by"),
                        React.createElement('span', { key: 'name', className: "text-base sm:text-lg font-medium border-b border-current" }, config.author)
                    ]),
                    React.createElement('div', { key: 'arrow', className: "absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40" },
                        React.createElement(Lucide.ChevronDown, { size: 24 })
                    )
                ]),
                React.createElement('div', { key: 'main', className: "relative flex flex-col md:flex-row" }, [
                    React.createElement('div', { key: 'left', className: "px-4 md:px-6 pb-10 md:pb-20 transition-all duration-700 " + (isTextActive ? "w-full" : "w-full md:w-1/2") }, config.sections.map(s => {
                        const alignCls = s.alignment === 'right' ? 'justify-end' : s.alignment === 'center' ? 'justify-center' : 'justify-start';
                        const renderMobileViz = () => {
                            if (s.cardType === 'TEXT') return null;
                            if (s.cardType === 'MAP') return React.createElement(MapView, { data, config: s.config, theme });
                            if (s.cardType === 'TIMELINE') return React.createElement(TimelineView, { data, config: s.config, theme });
                            if (s.cardType === 'STATISTICS') return React.createElement(ChartView, { data, config: s.config, theme });
                            if (s.cardType === 'NETWORK') return React.createElement(NetworkView, { data, config: s.config, theme });
                            if (s.cardType === 'GALLERY') return React.createElement(ImageView, { data, config: s.config, theme });
                            if (s.cardType === 'IMAGE') return React.createElement(SingleImageView, { data, config: s.config, theme });
                            return null;
                        };
                        if (s.cardType === 'TEXT') {
                            const taCls = s.config.textAlign === 'center' ? 'text-center' : s.config.textAlign === 'right' ? 'text-right' : s.config.textAlign === 'justify' ? 'text-justify' : 'text-left';
                            return React.createElement('div', { key: s.id, ref: el => sectionRefs.current[s.id] = el, 'data-id': s.id, className: "min-h-[60vh] md:min-h-[80vh] flex items-center " + alignCls + " py-10 md:py-20 transition-opacity duration-500 " + (activeId === s.id ? 'opacity-100' : 'md:opacity-20 opacity-100') },
                                React.createElement('div', { className: "w-full p-6 sm:p-8 md:p-12 rounded-2xl border border-t-4 " + theme.card + " " + theme.cardShadow + " " + taCls, style: { borderTopColor: theme.accentHex, isolation: 'isolate' } }, [
                                    React.createElement('h2', { key: 'h', className: "text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6 " + theme.headingColor }, s.title),
                                    renderTextWithEmbeds(s.content)
                                ])
                            );
                        }
                        return React.createElement('div', { key: s.id }, [
                            React.createElement('div', { key: 'text', ref: el => sectionRefs.current[s.id] = el, 'data-id': s.id, className: "min-h-[40vh] md:min-h-[80vh] flex items-center " + alignCls + " py-10 md:py-20 transition-opacity duration-500 " + (activeId === s.id ? 'opacity-100' : 'md:opacity-20 opacity-100') },
                                React.createElement('div', { className: "w-full md:max-w-lg p-6 sm:p-8 rounded-2xl border border-t-4 " + theme.card + " " + theme.cardShadow, style: { borderTopColor: theme.accentHex } }, [
                                    React.createElement('h2', { key: 'h', className: "text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6 " + theme.headingColor }, s.title),
                                    React.createElement('p', { key: 'p', className: "text-base md:text-lg leading-relaxed whitespace-pre-wrap" }, s.content)
                                ])
                            ),
                            React.createElement('div', { key: 'mviz', className: "mobile-viz mb-8 -mt-4" },
                                React.createElement('div', { className: "w-full h-[60vh] rounded-2xl overflow-hidden border " + theme.card + " " + theme.cardShadow }, renderMobileViz())
                            )
                        ]);
                    }),
                    React.createElement('div', { key: 'credits', className: "min-h-[30vh] md:min-h-[50vh] flex flex-col justify-end py-10 md:py-20" },
                        React.createElement('div', { className: "max-w-lg p-6 sm:p-8 rounded-2xl border " + theme.card + " opacity-80" }, [
                            React.createElement('div', { key: 'ack', className: "mb-8" }, [
                                React.createElement('h3', { key: 'h', className: "text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60" }, [
                                    React.createElement(Lucide.Users, { key: 'i', size: 14 }),
                                    " Credits & Acknowledgments"
                                ]),
                                React.createElement('p', { key: 'p', className: "text-sm leading-relaxed italic" }, config.collaborators || "This project was developed independently using the Polybius Engine.")
                            ]),
                            config.bibliography && config.bibliography.length > 0 && React.createElement('div', { key: 'bib' }, [
                                React.createElement('h3', { key: 'h', className: "text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60" }, [
                                    React.createElement(Lucide.BookOpen, { key: 'i', size: 14 }),
                                    " Select Bibliography"
                                ]),
                                React.createElement('ul', { key: 'list', className: "space-y-4" },
                                    config.bibliography.map(function(bib) {
                                        return React.createElement('li', { key: bib.id, className: "text-sm leading-relaxed" }, [
                                            bib.text,
                                            bib.url && React.createElement('a', { key: 'link', href: bib.url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex ml-2 opacity-30 hover:opacity-100 transition-opacity" },
                                                React.createElement(Lucide.ExternalLink, { size: 12 })
                                            )
                                        ]);
                                    })
                                )
                            ])
                        ])
                    )),
                    React.createElement('div', { key: 'right', className: "desktop-viz hidden md:block h-screen sticky top-0 transition-all duration-700 " + (isTextActive ? "opacity-0 pointer-events-none" : "opacity-100 w-1/2 pointer-events-auto"), style: isTextActive ? { width: 0, padding: 0 } : undefined },
                        React.createElement('div', { className: "h-full p-8 flex items-center transition-all duration-700 " + vizAlignCls },
                            React.createElement('div', { className: "w-full h-[85vh] rounded-3xl overflow-hidden border relative " + theme.card + " " + theme.cardShadow },
                                React.createElement(AnimatePresence, { mode: 'wait' },
                                    activeSection && activeSection.cardType !== 'TEXT' && React.createElement(motion.div, { key: activeId, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0" }, renderViz())
                                )
                            )
                        )
                    )
                ]),
                React.createElement('footer', { key: 'foot', className: "py-12 md:py-20 text-center opacity-60 px-4" }, [
                    React.createElement('div', { key: 'line', className: "h-px w-32 mx-auto mb-8 md:mb-12", style: { backgroundColor: theme.accentHex } }),
                    React.createElement('h2', { key: 'title', className: "text-xl md:text-2xl font-bold mb-2" }, config.title),
                    React.createElement('p', { key: 'sub', className: "text-xs sm:text-sm italic opacity-80 mb-8" }, config.subtitle),
                    React.createElement('div', { key: 'pb', className: "text-[9px] uppercase tracking-tighter opacity-40" }, "Powered by Polybius")
                ])
            ]);
        };

        const App = () => {
            const [payload, setPayload] = useState(null);
            useEffect(() => {
                fetch('./site-data.json').then(r => r.json()).then(data => setPayload(data)).catch(e => console.error("Could not load project data", e));
            }, []);
            if (!payload) return React.createElement('div', { className: "h-screen flex items-center justify-center" }, "Assembling Archives...");
            return React.createElement(Viewer, { config: payload.config, data: payload.data });
        };

        const root = createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>`;

      zip.file("index.html", viewerHtml);
      zip.file("README.txt", `POLYBIUS STANDALONE EXPORT\nGenerated: ${new Date().toLocaleString()}`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-standalone.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
    } catch (err) {
      console.error("Export failed:", err);
      setIsGenerating(false);
      alert("Export failed.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <div className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded rotate-45 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold -rotate-45">PB</span>
          </div>
          <span className="font-bold text-sm tracking-tight">Polybius</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title="Clear everything and start fresh">
            <Trash2 size={14} />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
            <button onClick={() => setMode('edit')} className={`px-3 py-1 text-xs font-medium rounded-md ${mode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}>Editor</button>
            <button onClick={handlePreviewClick} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${mode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}>
              Preview
              {mode === 'preview' && <RefreshCw size={11} className="opacity-60" />}
            </button>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50`}>
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={14} /> : <Package size={14} />}
            {isGenerating ? 'Bundling...' : showSuccess ? 'Export Success' : 'Generate Site'}
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 border border-zinc-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Start New Project?</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              This will clear all sections, data, and settings and reset to the sample Silk Road dataset. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
              <button onClick={handleClearAll} className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Clear Everything</button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-12">
        {mode === 'edit' ? <Editor config={config} data={data} onConfigChange={handleSave} onDataChange={handleDataUpdate} /> : <Viewer key={viewerKey} config={config} data={data} />}
      </div>
    </div>
  );
};

export default App;
