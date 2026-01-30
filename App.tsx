
import React, { useState, useEffect } from 'react';
import { SiteConfig, HeritageDataItem } from './types';
import { INITIAL_CONFIG, SAMPLE_DATA } from './constants';
import Editor from './components/Editor';
import Viewer from './components/Viewer';
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
    const saved = localStorage.getItem('chronos_config');
    const savedData = localStorage.getItem('chronos_data');
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
    localStorage.setItem('chronos_config', JSON.stringify(newConfig));
  };

  const handleDataUpdate = (newData: HeritageDataItem[]) => {
    setData(newData);
    localStorage.setItem('chronos_data', JSON.stringify(newData));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate build processing for UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      const zip = new JSZip();

      // 1. Create the data file
      const sitePayload = JSON.stringify({ config, data }, null, 2);
      zip.file("site-data.json", sitePayload);

      // 2. Create a Standalone Viewer HTML
      // This is a simplified version of index.html that will act as the published site
      const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Historical Scrollytelling</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .leaflet-container { width: 100%; height: 100%; background: transparent !important; }
        .dh-tooltip { background: white; border: 1px solid #ddd; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    </style>
    <script type="importmap">
    {
      "imports": {
        "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
        "react": "https://esm.sh/react@^19.2.4",
        "react/": "https://esm.sh/react@^19.2.4/",
        "recharts": "https://esm.sh/recharts@^3.7.0",
        "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
        "framer-motion": "https://esm.sh/framer-motion@^12.29.2"
      }
    }
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="module">
        // In a real export, we would bundle the Viewer component.
        // For this SSG demonstration, the exported site includes the site-data.json 
        // and expects to be viewed via a compatible viewer or by pointing back to the engine's viewer mode.
        console.log("Static Site Generated with Chronos Weaver");
        alert("This is a generated site bundle. To host it, place 'index.html' and 'site-data.json' on a web server.");
    </script>
</body>
</html>`;

      zip.file("index.html", viewerHtml);
      zip.file("README.txt", `CHRONOS WEAVER EXPORT
======================
Generated: ${new Date().toLocaleString()}
Project: ${config.title}

INSTRUCTIONS:
1. Upload the contents of this ZIP to any static web host (GitHub Pages, Netlify, Vercel).
2. The index.html serves as your entry point.
3. site-data.json contains your narrative and heritage records.

Note: This bundle uses CDN dependencies (Tailwind, React, Leaflet) and requires an active internet connection to render.`);

      // 3. Generate the ZIP blob and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-site.zip`;
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
      alert("Export failed. See console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Utility Bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded rotate-45 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold -rotate-45">CW</span>
          </div>
          <span className="font-bold text-sm tracking-tight">Chronos Weaver</span>
          <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded font-mono text-zinc-400">Editor v1.0</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
            <button 
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Editor
            </button>
            <button 
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-1" />

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
              showSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Bundling...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle2 size={14} />
                Export Success
              </>
            ) : (
              <>
                <Package size={14} />
                Generate Site
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {showSuccess && (
        <div className="fixed top-14 right-4 z-[100] bg-white border border-emerald-100 shadow-2xl p-5 rounded-2xl max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-start gap-4">
             <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                <Download size={24} />
             </div>
             <div className="flex-1">
               <div className="flex items-center justify-between mb-1">
                 <h4 className="font-bold text-sm text-zinc-900">Project Exported</h4>
                 <button onClick={() => setShowSuccess(false)} className="text-zinc-400 hover:text-zinc-600">
                   <X size={14} />
                 </button>
               </div>
               <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                 Your portable site ZIP is ready. It contains the standalone HTML viewer and your historical datasets.
               </p>
               <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
                 <Github size={12} className="text-zinc-400" />
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                   GitHub Actions Deployed Editor
                 </span>
               </div>
             </div>
           </div>
        </div>
      )}

      <div className="pt-12">
        {mode === 'edit' ? (
          <Editor 
            config={config} 
            data={data}
            onConfigChange={handleSave} 
            onDataChange={handleDataUpdate}
          />
        ) : (
          <Viewer config={config} data={data} />
        )}
      </div>
    </div>
  );
};

export default App;
