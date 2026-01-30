
import React, { useState, useMemo } from 'react';
import { SiteConfig, ThemeType, Section, CardType, HeritageDataItem, BibliographyEntry } from '../types';
import { 
  Plus, Trash2, Settings, Download, Upload, FileText, Layout, Palette, 
  Info, Users, Link as LinkIcon, Github, Globe, CheckCircle2, 
  ChevronDown, ChevronUp, Map as MapIcon, Calendar, Share2, 
  BarChart2, HelpCircle, BookOpen, Database, Zap, HardDrive, Package,
  AlertCircle, ArrowRight, Layers
} from 'lucide-react';

interface EditorProps {
  config: SiteConfig;
  data: HeritageDataItem[];
  onConfigChange: (config: SiteConfig) => void;
  onDataChange: (data: HeritageDataItem[]) => void;
}

const Editor: React.FC<EditorProps> = ({ config, data, onConfigChange, onDataChange }) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'content' | 'theme' | 'data' | 'help'>('content');
  const [expandedSection, setExpandedSection] = useState<string | null>(config.sections[0]?.id || null);

  const dataHeaders = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const updateConfig = (updates: Partial<SiteConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const addSection = () => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Section",
      content: "Add your narrative here...",
      cardType: CardType.TIMELINE,
      config: { 
        dateKey: dataHeaders.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('year')) || dataHeaders[0],
        labelKey: dataHeaders.find(h => h.toLowerCase().includes('label') || h.toLowerCase().includes('name')) || dataHeaders[0]
      }
    };
    const newSections = [...config.sections, newSection];
    updateConfig({ sections: newSections });
    setExpandedSection(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    const newSections = config.sections.map(s => s.id === id ? { ...s, ...updates } : s);
    updateConfig({ sections: newSections });
  };

  const updateSectionConfig = (sectionId: string, key: string, value: any) => {
    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      config: { ...section.config, [key]: value }
    });
  };

  const removeSection = (id: string) => {
    updateConfig({ sections: config.sections.filter(s => s.id !== id) });
  };

  const addBibliography = () => {
    const newEntry: BibliographyEntry = { id: Math.random().toString(36).substr(2, 9), text: "", url: "" };
    updateConfig({ bibliography: [...config.bibliography, newEntry] });
  };

  const updateBibliography = (id: string, text: string, url: string) => {
    const newBib = config.bibliography.map(b => b.id === id ? { ...b, text, url } : b);
    updateConfig({ bibliography: newBib });
  };

  const removeBibliography = (id: string) => {
    updateConfig({ bibliography: config.bibliography.filter(b => b.id !== id) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 1) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const jsonData = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, i) => {
          let val: any = values[i]?.trim();
          if (!isNaN(val) && val !== '') val = Number(val);
          obj[header] = val;
          return obj;
        }, {} as any);
      });
      onDataChange(jsonData);
    };
    reader.readAsText(file);
  };

  const handleDownloadBackup = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => {
        const value = row[fieldName];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${config.title.toLowerCase().replace(/\s+/g, '-')}-data-backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Sidebar Tabs */}
      <div className="w-16 bg-white border-r border-zinc-200 flex flex-col items-center py-4 gap-6">
        <button 
          onClick={() => setActiveTab('meta')}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'meta' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          title="Meta & Credits"
        >
          <Settings size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('content')}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          title="Sections & Narrative"
        >
          <Layout size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('theme')}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'theme' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          title="Themes"
        >
          <Palette size={20} />
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'data' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          title="Dataset"
        >
          <FileText size={20} />
        </button>
        <div className="mt-auto mb-4">
          <button 
            onClick={() => setActiveTab('help')}
            className={`p-2 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
            title="User Manual"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Main Configuration Panel */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 p-8">
        <div className="max-w-3xl mx-auto pb-20">
          {activeTab === 'meta' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-800">Site Identity & Credits</h2>
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Site Title</label>
                    <input type="text" value={config.title} onChange={(e) => updateConfig({ title: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Primary Author</label>
                    <input type="text" value={config.author} onChange={(e) => updateConfig({ author: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Site Subtitle</label>
                  <input type="text" value={config.subtitle} onChange={(e) => updateConfig({ subtitle: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1"><Users size={12} /> Acknowledgements</label>
                  <textarea rows={3} value={config.collaborators} onChange={(e) => updateConfig({ collaborators: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" placeholder="Recognize institutions, grants, or team members..." />
                </div>
              </div>
              <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative">
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3"><Github size={20} /><h3 className="font-bold text-lg">GitHub Actions Integration</h3></div>
                   <p className="text-sm text-indigo-100 leading-relaxed mb-4">The editor tool itself is deployed via GitHub Pages. For your generated stories, download the ZIP and host manually or on any static host.</p>
                 </div>
                 <Github size={120} className="absolute -bottom-8 -right-8 opacity-10 rotate-12" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-indigo-600" /> Bibliography</h3><button onClick={addBibliography} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14} /> Add Source</button></div>
                {config.bibliography.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex gap-4">
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Citation" value={entry.text} onChange={(e) => updateBibliography(entry.id, e.target.value, entry.url || "")} className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <div className="flex items-center gap-2"><LinkIcon size={12} className="text-zinc-400" /><input type="text" placeholder="Link URL" value={entry.url || ""} onChange={(e) => updateBibliography(entry.id, entry.text, e.target.value)} className="flex-1 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                    </div>
                    <button onClick={() => removeBibliography(entry.id)} className="text-zinc-300 hover:text-red-500 transition-colors self-start p-1"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-zinc-800">Narrative Flow</h2><button onClick={addSection} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"><Plus size={16} /> Add Section</button></div>
              {config.sections.map((section, index) => {
                const isExpanded = expandedSection === section.id;
                return (
                  <div key={section.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-50' : 'border-zinc-200 shadow-sm'}`}>
                    <div onClick={() => setExpandedSection(isExpanded ? null : section.id)} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 rounded-t-xl transition-colors">
                      <div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{index + 1}</div><span className="font-semibold text-zinc-700 text-sm">{section.title || "Untitled Section"}</span><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">{section.cardType}</span></div>
                      <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }} className="text-zinc-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>{isExpanded ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}</div>
                    </div>
                    {isExpanded && (
                      <div className="p-6 pt-2 border-t border-zinc-100 space-y-6 animate-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Section Heading</label><input type="text" value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" /></div>
                          <div><label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Visualization Type</label><select value={section.cardType} onChange={(e) => updateSection(section.id, { cardType: e.target.value as CardType })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"><option value={CardType.TIMELINE}>Timeline View</option><option value={CardType.MAP}>Geographic Map</option><option value={CardType.NETWORK}>Network Graph</option><option value={CardType.STATISTICS}>Statistical Chart</option></select></div>
                        </div>
                        <div><label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Historical Chronicle</label><textarea rows={4} value={section.content} onChange={(e) => updateSection(section.id, { content: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed" placeholder="Interweave your analysis with the data points..." /></div>
                        <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                           <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 pb-2">{section.cardType === CardType.MAP && <MapIcon size={16} className="text-indigo-500" />}{section.cardType === CardType.TIMELINE && <Calendar size={16} className="text-indigo-500" />}{section.cardType === CardType.NETWORK && <Share2 size={16} className="text-indigo-500" />}{section.cardType === CardType.STATISTICS && <BarChart2 size={16} className="text-indigo-500" />}<h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Mapping & Constraints</h4></div>
                           <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                              <div><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Display Label</label><select value={section.config.labelKey || ''} onChange={(e) => updateSectionConfig(section.id, 'labelKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                              {section.cardType === CardType.TIMELINE && (<div><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Date Column</label><select value={section.config.dateKey || ''} onChange={(e) => updateSectionConfig(section.id, 'dateKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>)}
                              {section.cardType === CardType.MAP && (<><div className="col-span-1"><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Latitude</label><select value={section.config.latKey || ''} onChange={(e) => updateSectionConfig(section.id, 'latKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div><div className="col-span-1"><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Longitude</label><select value={section.config.lngKey || ''} onChange={(e) => updateSectionConfig(section.id, 'lngKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div><div><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Base Map</label><select value={section.config.baseMap || 'terrain'} onChange={(e) => updateSectionConfig(section.id, 'baseMap', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs"><option value="terrain">Terrain</option><option value="toner">Toner</option><option value="satellite">Satellite</option><option value="voyager">Voyager</option></select></div></>)}
                              {section.cardType === CardType.NETWORK && (<div><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Connections</label><select value={section.config.connectionsKey || ''} onChange={(e) => updateSectionConfig(section.id, 'connectionsKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>)}
                              {section.cardType === CardType.STATISTICS && (<div><label className="block text-[10px] font-semibold text-zinc-500 mb-1">Category</label><select value={section.config.categoryKey || ''} onChange={(e) => updateSectionConfig(section.id, 'categoryKey', e.target.value)} className="w-full px-2 py-1.5 border border-zinc-200 rounded bg-white text-xs">{dataHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>)}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-800">Visual Aesthetic</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['classic', 'parchment', 'academic', 'dark'] as ThemeType[]).map((t) => (
                  <button key={t} onClick={() => updateConfig({ theme: t })} className={`p-4 rounded-xl border-2 transition-all text-left ${config.theme === t ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}><div className="capitalize font-bold text-zinc-900 mb-1">{t}</div><p className="text-xs text-zinc-500">{t === 'classic' && "Clean and modern baseline."}{t === 'parchment' && "Warm tones and serif fonts."}{t === 'academic' && "High contrast and structured."}{t === 'dark' && "Archival dark mode."}</p></button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-zinc-800">Heritage Dataset</h2><div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100"><Info size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Static Export Ready</span></div></div>
              <div className="bg-white p-8 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center"><Upload size={32} className="text-zinc-400 mb-4" /><h3 className="font-semibold text-zinc-800 mb-2">Import Records</h3><p className="text-sm text-zinc-500 mb-6 max-w-sm">Upload historical data in CSV format. Your dataset will be bundled into the static site.</p><input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" /><label htmlFor="csv-upload" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm">Choose CSV File</label></div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-zinc-700 uppercase text-xs tracking-widest">Active Inventory ({data.length})</h3><button onClick={handleDownloadBackup} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline active:scale-95 transition-transform"><Download size={14} /> Local Backup</button></div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm bg-white"><table className="w-full text-left border-collapse"><thead className="bg-zinc-50 text-zinc-400 uppercase text-[10px] font-bold"><tr>{dataHeaders.slice(0, 5).map(h => (<th key={h} className="px-4 py-2 border-b">{h}</th>))}</tr></thead><tbody className="text-sm divide-y divide-zinc-100">{data.map((item, i) => (<tr key={item.id || i} className="hover:bg-indigo-50/30 transition-colors">{dataHeaders.slice(0, 5).map(h => (<td key={h} className="px-4 py-3 text-zinc-500">{item[h]?.toString().slice(0, 20)}{item[h]?.toString().length > 20 ? '...' : ''}</td>))}</tr>))}</tbody></table></div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <header className="border-b border-zinc-200 pb-8">
                <h2 className="text-4xl font-black text-zinc-900 mb-3 tracking-tighter">Project Manual</h2>
                <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
                  Chronos Weaver is a **Static Site Generator (SSG)** purpose-built for Digital Humanities scholars to transform archival datasets into immersive historical narratives.
                </p>
              </header>

              {/* 1. Core Workflow */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl"><BookOpen size={24} /></div>
                  <h3 className="font-black text-2xl tracking-tight">I. Core Workflow</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: <Database />, title: "Ingest", desc: "Upload your heritage CSV data in the Dataset tab." },
                    { icon: <Layers />, title: "Weave", desc: "Compose narrative sections and map them to data columns." },
                    { icon: <Package />, title: "Export", desc: "Download a standalone ZIP to host anywhere." }
                  ].map((step, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                      <div className="text-indigo-500 mb-3">{step.icon}</div>
                      <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Data Standards */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl"><Database size={24} /></div>
                  <h3 className="font-black text-2xl tracking-tight">II. Data Standards & Schema</h3>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <div className="space-y-2">
                    <h4 className="font-bold text-amber-900 text-sm">Critical: Character Encoding</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Always save your CSV files as **UTF-8** (Comma Delimited). This ensures special characters in historical names or dates are preserved across different operating systems.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
                    <h4 className="font-bold text-zinc-800 mb-4 flex items-center gap-2">
                      <Info size={18} className="text-indigo-500" /> Required Columns by View Type
                    </h4>
                    <div className="space-y-6">
                      <div className="border-l-4 border-indigo-500 pl-4 py-1">
                        <h5 className="font-bold text-xs uppercase text-zinc-400 mb-2">Chronological View (Timeline)</h5>
                        <p className="text-sm text-zinc-700 mb-2">Requires a **Numeric Date** column. Supports years (e.g., 1250) or standard ISO dates.</p>
                        <div className="bg-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400">
                          year,label,category<br/>
                          1245,Formation of the Ilkhanate,Politics<br/>
                          1294,Death of Kublai Khan,Politics
                        </div>
                      </div>

                      <div className="border-l-4 border-indigo-500 pl-4 py-1">
                        <h5 className="font-bold text-xs uppercase text-zinc-400 mb-2">Geospatial View (Map)</h5>
                        <p className="text-sm text-zinc-700 mb-2">Requires **Decimal Coordinate** columns (e.g., Lat 39.65). Do not use Degree/Minute format.</p>
                        <div className="bg-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400">
                          latitude,longitude,label<br/>
                          39.65,66.97,Samarkand<br/>
                          40.14,94.66,Dunhuang
                        </div>
                      </div>

                      <div className="border-l-4 border-indigo-500 pl-4 py-1">
                        <h5 className="font-bold text-xs uppercase text-zinc-400 mb-2">Relational View (Network)</h5>
                        <p className="text-sm text-zinc-700 mb-2">Requires an **ID** column and a **Connections** column (Comma-separated IDs or labels).</p>
                        <div className="bg-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400">
                          id,label,connections<br/>
                          S1,Samarkand,"S2,S4"<br/>
                          S2,Dunhuang,S1
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Thematic Design */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl"><Palette size={24} /></div>
                  <h3 className="font-black text-2xl tracking-tight">III. Thematic Aesthetic</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm">Classic & Academic</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed">Use these for modern research papers, scientific heritage, or datasets that require high legibility and a neutral canvas.</p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm">Parchment & Dark</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed">Best for pre-modern history, manuscript studies, and archival collections where atmospheric immersion is prioritized.</p>
                  </div>
                </div>
              </section>

              {/* 4. Publishing */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl"><Globe size={24} /></div>
                  <h3 className="font-black text-2xl tracking-tight">IV. Publishing & Hosting</h3>
                </div>
                <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4">Going Live in 3 Steps</h4>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">1</div>
                        <p className="text-sm text-indigo-100 italic">Generate your site bundle (ZIP).</p>
                      </li>
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">2</div>
                        <p className="text-sm text-indigo-100 italic">Extract contents to a folder on your computer.</p>
                      </li>
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">3</div>
                        <p className="text-sm text-indigo-100 italic">Upload all files to **GitHub Pages**, **Vercel**, or your institution's static host.</p>
                      </li>
                    </ul>
                  </div>
                  <Package size={200} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
                </div>
                
                <div className="bg-zinc-100 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive size={20} className="text-zinc-400" />
                    <div>
                      <h5 className="text-xs font-bold text-zinc-700">Need a Data Refresh?</h5>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Use the 'Local Backup' button in the Dataset tab.</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-zinc-300" />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
