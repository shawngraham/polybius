
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
          forest: { bg: 'bg-[#f0ebe3]', text: 'text-[#2d3a2e]', accent: 'bg-[#5a7247]', font: 'font-serif', card: 'bg-[#e8e0d4] border-[#c4b9a8]', headingColor: 'text-[#3d5230]', accentHex: '#5a7247', cardShadow: 'shadow-xl' }
        };

        // --- SUB-COMPONENTS ---
        const TimelineView = ({ data, config, theme }) => {
            const dateKey = config.dateKey || 'date';
            const labelKey = config.labelKey || 'label';
            const sortedData = [...data]
                .filter(d => d[dateKey] !== undefined && !isNaN(Number(d[dateKey])))
                .sort((a, b) => Number(a[dateKey]) - Number(b[dateKey]));
            
            if (sortedData.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No temporal data found.");
            
            const min = Number(sortedData[0][dateKey]);
            const max = Number(sortedData[sortedData.length - 1][dateKey]);
            const range = max - min || 1;

            return React.createElement('div', { className: "h-full w-full p-12 flex flex-col" }, [
                React.createElement('h3', { className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Temporal Progression"),
                React.createElement('div', { className: "relative flex-1" }, [
                    React.createElement('div', { className: "absolute top-1/2 left-0 right-0 h-px bg-current opacity-20" }),
                    ...sortedData.map((item, idx) => {
                        const pos = ((Number(item[dateKey]) - min) / range) * 100;
                        const isTop = idx % 2 === 0;
                        return React.createElement('div', { 
                            key: idx, 
                            className: "absolute flex flex-col items-center group",
                            style: { left: pos + '%', transform: 'translateX(-50%)' }
                        }, [
                            isTop && React.createElement('div', { className: "mb-4 text-center w-32" }, [
                                React.createElement('span', { className: "text-sm font-bold block" }, item[dateKey]),
                                React.createElement('span', { className: "text-[10px] opacity-70 block truncate" }, item[labelKey])
                            ]),
                            React.createElement('div', { className: "w-3 h-3 rounded-full " + theme.accent }),
                            !isTop && React.createElement('div', { className: "mt-4 text-center w-32" }, [
                                React.createElement('span', { className: "text-sm font-bold block" }, item[dateKey]),
                                React.createElement('span', { className: "text-[10px] opacity-70 block truncate" }, item[labelKey])
                            ])
                        ]);
                    })
                ])
            ]);
        };

        const MapView = ({ data, config, theme }) => {
            const mapRef = useRef(null);
            const mapInstance = useRef(null);
            const layerGroup = useRef(null);
            
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
                
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
                
                const latKey = config.latKey || 'latitude';
                const lngKey = config.lngKey || 'longitude';
                const labelKey = config.labelKey || 'label';
                
                const markers = [];
                data.filter(d => !isNaN(d[latKey]) && !isNaN(d[lngKey])).forEach(point => {
                    const m = L.circleMarker([point[latKey], point[lngKey]], {
                        radius: 6, fillColor: '#4f46e5', color: '#fff', weight: 1, fillOpacity: 0.8
                    }).bindTooltip(point[labelKey]?.toString() || "Untitled", { className: 'dh-tooltip' });
                    m.addTo(layers);
                    markers.push(m);
                });
                
                if (markers.length > 0) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
            }, [data, config]);
            
            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { className: "p-8 font-bold uppercase opacity-60" }, "Spatial Context"),
                React.createElement('div', { ref: mapRef, className: "flex-1 m-8 mt-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-inner" })
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
                                React.createElement(XAxis, { key: 'x', dataKey: "x", type: "number", name: xKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(YAxis, { key: 'y', dataKey: "y", type: "number", name: yKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
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
                                React.createElement(XAxis, { key: 'x', dataKey: "x", type: "number", name: xKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
                                React.createElement(YAxis, { key: 'y', dataKey: "y", type: "number", name: yKey, tick: { fill: 'currentColor', fontSize: 10 }, axisLine: false, tickLine: false }),
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

        const NetworkView = ({ data, config, theme }) => {
            const connectionsKey = config.connectionsKey || 'connections';
            const labelKey = config.labelKey || 'label';
            const centerX = 200;
            const centerY = 150;
            const radius = 100;

            return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                React.createElement('h3', { className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Relational Network"),
                React.createElement('div', { className: "flex-1 relative overflow-hidden bg-current/5 rounded-2xl" }, 
                    React.createElement('svg', { viewBox: "0 0 400 300", className: "w-full h-full" }, [
                        ...data.flatMap((item, idx) => {
                            const angle = (idx / data.length) * Math.PI * 2;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            const conns = item[connectionsKey];
                            if (!conns || !Array.isArray(conns)) return [];
                            return conns.map(targetId => {
                                const targetIdx = data.findIndex(d => d.id === targetId || d[labelKey] === targetId);
                                if (targetIdx === -1) return null;
                                const tAngle = (targetIdx / data.length) * Math.PI * 2;
                                const tx = centerX + radius * Math.cos(tAngle);
                                const ty = centerY + radius * Math.sin(tAngle);
                                return React.createElement('line', { key: item.id + '-' + targetId, x1: x, y1: y, x2: tx, y2: ty, stroke: "currentColor", strokeWidth: 1, className: "opacity-20" });
                            });
                        }),
                        ...data.map((item, idx) => {
                            const angle = (idx / data.length) * Math.PI * 2;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            return React.createElement('g', { key: idx, className: "group" }, [
                                React.createElement('circle', { cx: x, cy: y, r: 10, fill: "#4f46e5", className: "transition-transform group-hover:scale-125 shadow" }),
                                React.createElement('text', { x: x, y: y + 20, fontSize: 8, textAnchor: "middle", className: "fill-current font-bold" }, item[labelKey])
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
            const items = data.filter(d => d[imageKey]);
            const [activeIndex, setActiveIndex] = useState(0);

            if (items.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No image data found.");

            const activeItem = items[activeIndex];
            const imageUrl = activeItem[imageKey];
            const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
            const resolvedUrl = isIIIF && !imageUrl.match(/\\.(jpg|jpeg|png|gif|webp)/i)
              ? imageUrl.replace(/\\/$/, '') + '/full/800,/0/default.jpg'
              : imageUrl;

            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { className: "p-8 pb-0 flex items-center justify-between" }, [
                    React.createElement('h3', { className: "text-xl font-bold uppercase opacity-60" }, "Gallery"),
                    React.createElement('span', { className: "text-xs font-bold opacity-40" }, (activeIndex + 1) + " / " + items.length)
                ]),
                React.createElement('div', { className: "flex-1 p-8 flex flex-col min-h-0" }, [
                    React.createElement('div', { className: "flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0" },
                        React.createElement('img', { src: resolvedUrl, alt: activeItem[labelKey] || 'Image', className: "w-full h-full object-contain" })
                    ),
                    React.createElement('div', { className: "mt-4 text-center" }, [
                        React.createElement('p', { className: "text-sm font-bold" }, activeItem[labelKey] || 'Untitled'),
                        activeItem[descKey] && React.createElement('p', { className: "text-xs opacity-70 mt-1" }, activeItem[descKey])
                    ]),
                    items.length > 1 && React.createElement('div', { className: "mt-4 flex items-center justify-center gap-2" },
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
            const itemIndex = config.itemIndex ?? 0;
            const items = data.filter(d => d[imageKey]);

            if (items.length === 0) return React.createElement('div', { className: "p-20 text-center opacity-50" }, "No image data found.");

            const clampedIndex = Math.min(itemIndex, items.length - 1);
            const item = items[clampedIndex];
            const imageUrl = item[imageKey];
            const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
            const resolvedUrl = isIIIF && !imageUrl.match(/\\.(jpg|jpeg|png|gif|webp)/i)
              ? imageUrl.replace(/\\/$/, '') + '/full/800,/0/default.jpg'
              : imageUrl;

            return React.createElement('div', { className: "h-full w-full flex flex-col" }, [
                React.createElement('div', { className: "p-8 pb-0" },
                    React.createElement('h3', { className: "text-xl font-bold uppercase opacity-60" }, "Image")
                ),
                React.createElement('div', { className: "flex-1 p-8 flex flex-col min-h-0" }, [
                    React.createElement('div', { className: "flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0" },
                        React.createElement('img', { src: resolvedUrl, alt: item[labelKey] || 'Image', className: "w-full h-full object-contain" })
                    ),
                    React.createElement('div', { className: "mt-4 text-center" }, [
                        React.createElement('p', { className: "text-sm font-bold" }, item[labelKey] || 'Untitled'),
                        item[descKey] && React.createElement('p', { className: "text-xs opacity-70 mt-1" }, item[descKey])
                    ])
                ])
            ]);
        };

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
                React.createElement('style', null, "::selection { background-color: " + theme.accentHex + "33; }"),
                React.createElement('header', { className: "h-[50vh] md:h-[70vh] flex flex-col items-center justify-center text-center px-4 md:px-6 relative" }, [
                    React.createElement('h1', { className: "text-3xl sm:text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight" }, config.title),
                    React.createElement('div', { className: "h-1 w-24 rounded-full mx-auto mt-2 mb-4 md:mb-6", style: { backgroundColor: theme.accentHex } }),
                    React.createElement('p', { className: "text-base sm:text-xl md:text-2xl opacity-80 italic max-w-2xl mb-6 md:mb-0" }, config.subtitle),
                    React.createElement('div', { className: "mt-6 md:mt-8 flex flex-col items-center" }, [
                        React.createElement('span', { className: "text-xs font-bold uppercase tracking-widest opacity-50" }, "Authored by"),
                        React.createElement('span', { className: "text-base sm:text-lg font-medium border-b border-current" }, config.author)
                    ]),
                    React.createElement('div', { className: "absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40" },
                        React.createElement(Lucide.ChevronDown, { size: 24 })
                    )
                ]),
                React.createElement('div', { className: "relative flex flex-col md:flex-row" }, [
                    React.createElement('div', { className: "px-4 md:px-6 pb-10 md:pb-20 transition-all duration-700 " + (isTextActive ? "w-full" : "w-full md:w-1/2") }, config.sections.map(s => {
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
                                React.createElement('div', { className: "w-full p-6 sm:p-8 md:p-12 rounded-2xl border border-t-4 " + theme.card + " " + theme.cardShadow + " " + taCls, style: { borderTopColor: theme.accentHex } }, [
                                    React.createElement('h2', { key: 'h', className: "text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6 " + theme.headingColor }, s.title),
                                    React.createElement('p', { key: 'p', className: "text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap" }, s.content)
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
                    })),
                    React.createElement('div', { className: "desktop-viz hidden md:block w-1/2 h-screen sticky top-0 transition-all duration-700 " + (isTextActive ? "opacity-0 w-0 p-0" : "opacity-100") },
                        React.createElement('div', { className: "h-full p-8 flex items-center transition-all duration-700 " + vizAlignCls },
                            React.createElement('div', { className: "w-full h-[85vh] rounded-3xl overflow-hidden border relative " + theme.card + " " + theme.cardShadow },
                                React.createElement(AnimatePresence, { mode: 'wait' },
                                    activeSection && activeSection.cardType !== 'TEXT' && React.createElement(motion.div, { key: activeId, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0" }, renderViz())
                                )
                            )
                        )
                    )
                ]),
                React.createElement('footer', { className: "py-12 md:py-20 text-center opacity-60 px-4" }, [
                    React.createElement('div', { className: "h-px w-32 mx-auto mb-8 md:mb-12", style: { backgroundColor: theme.accentHex } }),
                    React.createElement('h2', { className: "text-xl md:text-2xl font-bold" }, config.title),
                    React.createElement('p', { className: "text-xs mt-2 uppercase tracking-widest" }, "Powered by Polybius")
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
