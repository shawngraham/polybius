
import React, { useState, useEffect } from 'react';
import { SiteConfig, HeritageDataItem } from './types.ts';
import { INITIAL_CONFIG, SAMPLE_DATA } from './constants.tsx';
import Editor from './components/Editor.tsx';
import Viewer from './components/Viewer.tsx';
import { Package, CheckCircle2, Loader2, Github, X, Download } from 'lucide-react';
// @ts-ignore
import JSZip from 'https://esm.sh/jszip';

const App: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [data, setData] = useState<HeritageDataItem[]>(SAMPLE_DATA);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('chronos_weaver_config');
    const savedData = localStorage.getItem('chronos_weaver_data');
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
    localStorage.setItem('chronos_weaver_config', JSON.stringify(newConfig));
  };

  const handleDataUpdate = (newData: HeritageDataItem[]) => {
    setData(newData);
    localStorage.setItem('chronos_weaver_data', JSON.stringify(newData));
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
    <title>${config.title} | Chronos Weaver Export</title>
    
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
        import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

        // --- CONSTANTS & TYPES ---
        const THEMES = {
          classic: { bg: 'bg-white', text: 'text-gray-900', accent: 'bg-blue-600', font: 'font-sans', card: 'bg-gray-50 border-gray-200' },
          parchment: { bg: 'bg-[#f4ead5]', text: 'text-[#432e1a]', accent: 'bg-[#8b4513]', font: 'font-serif', card: 'bg-[#ede0c8] border-[#d4c3a3]' },
          academic: { bg: 'bg-zinc-100', text: 'text-zinc-900', accent: 'bg-zinc-800', font: 'font-serif', card: 'bg-white border-zinc-300' },
          dark: { bg: 'bg-zinc-950', text: 'text-zinc-100', accent: 'bg-amber-500', font: 'font-sans', card: 'bg-zinc-900 border-zinc-800' }
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

        const ChartView = ({ data, config, theme }) => {
            const categoryKey = config.categoryKey || 'category';
            const counts = data.reduce((acc, item) => {
                const val = item[categoryKey]?.toString() || 'Uncategorized';
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {});
            const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

            return React.createElement('div', { className: "h-full w-full p-10 flex flex-col" }, [
                React.createElement('h3', { className: "text-xl font-bold mb-8 uppercase opacity-60" }, "Distribution Analysis"),
                React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, 
                    React.createElement(BarChart, { data: chartData, layout: "vertical" }, [
                        React.createElement(XAxis, { type: "number", hide: true }),
                        React.createElement(YAxis, { dataKey: "name", type: "category", width: 100, axisLine: false, tickLine: false, tick: { fontSize: 10, fontWeight: 'bold' } }),
                        React.createElement(Tooltip, { contentStyle: { borderRadius: '12px', border: 'none' } }),
                        React.createElement(Bar, { dataKey: "value", radius: [0, 4, 4, 0] }, 
                            chartData.map((e, i) => React.createElement(Cell, { key: i, fill: '#4f46e5' }))
                        )
                    ])
                )
            ]);
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

            const renderViz = () => {
                if (!activeSection) return null;
                if (activeSection.cardType === 'MAP') return React.createElement(MapView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'TIMELINE') return React.createElement(TimelineView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'STATISTICS') return React.createElement(ChartView, { data, config: activeSection.config, theme });
                if (activeSection.cardType === 'NETWORK') return React.createElement(NetworkView, { data, config: activeSection.config, theme });
                return React.createElement('div', { className: "p-20 text-center opacity-30" }, "Visualization type not supported.");
            };

            return React.createElement('div', { className: "min-h-screen transition-colors duration-700 " + theme.bg + " " + theme.text + " " + theme.font }, [
                React.createElement('header', { className: "h-[70vh] flex flex-col items-center justify-center text-center px-6" }, [
                    React.createElement('h1', { className: "text-5xl md:text-7xl font-bold mb-4 tracking-tight" }, config.title),
                    React.createElement('p', { className: "text-xl md:text-2xl opacity-80 italic max-w-2xl" }, config.subtitle),
                    React.createElement('div', { className: "mt-8 flex flex-col items-center" }, [
                        React.createElement('span', { className: "text-xs font-bold uppercase tracking-widest opacity-50" }, "Authored by"),
                        React.createElement('span', { className: "text-lg font-medium border-b border-current" }, config.author)
                    ])
                ]),
                React.createElement('div', { className: "relative flex flex-col md:flex-row" }, [
                    React.createElement('div', { className: "w-full md:w-1/2 px-6 pb-20" }, config.sections.map(s => 
                        React.createElement('div', { key: s.id, ref: el => sectionRefs.current[s.id] = el, 'data-id': s.id, className: "min-h-[80vh] flex items-center justify-center py-20 transition-opacity duration-500 " + (activeId === s.id ? 'opacity-100' : 'opacity-20') }, 
                            React.createElement('div', { className: "max-w-lg p-8 rounded-2xl shadow-xl border " + theme.card }, [
                                React.createElement('h2', { className: "text-3xl font-bold mb-6" }, s.title),
                                React.createElement('p', { className: "text-lg leading-relaxed whitespace-pre-wrap" }, s.content)
                            ])
                        )
                    )),
                    React.createElement('div', { className: "hidden md:block w-1/2 h-screen sticky top-0" }, 
                        React.createElement('div', { className: "h-full p-8 flex items-center justify-center" }, 
                            React.createElement('div', { className: "w-full h-[85vh] rounded-3xl overflow-hidden shadow-2xl border bg-white relative " + theme.card }, 
                                React.createElement(AnimatePresence, { mode: 'wait' }, 
                                    activeSection && React.createElement(motion.div, { key: activeId, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0" }, renderViz())
                                )
                            )
                        )
                    )
                ]),
                React.createElement('footer', { className: "py-20 text-center border-t border-current/10 opacity-60" }, [
                    React.createElement('h2', { className: "text-2xl font-bold" }, config.title),
                    React.createElement('p', { className: "text-xs mt-2 uppercase tracking-widest" }, "Powered by Chronos Weaver")
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
      zip.file("README.txt", `CHRONOS WEAVER STANDALONE EXPORT\nGenerated: ${new Date().toLocaleString()}`);

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
            <span className="text-white text-[10px] font-bold -rotate-45">CW</span>
          </div>
          <span className="font-bold text-sm tracking-tight">Chronos Weaver</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
            <button onClick={() => setMode('edit')} className={`px-3 py-1 text-xs font-medium rounded-md ${mode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}>Editor</button>
            <button onClick={() => setMode('preview')} className={`px-3 py-1 text-xs font-medium rounded-md ${mode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500'}`}>Preview</button>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50`}>
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={14} /> : <Package size={14} />}
            {isGenerating ? 'Bundling...' : showSuccess ? 'Export Success' : 'Generate Site'}
          </button>
        </div>
      </div>

      <div className="pt-12">
        {mode === 'edit' ? <Editor config={config} data={data} onConfigChange={handleSave} onDataChange={handleDataUpdate} /> : <Viewer config={config} data={data} />}
      </div>
    </div>
  );
};

export default App;
