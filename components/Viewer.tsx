
import React, { useState, useEffect, useRef } from 'react';
import { SiteConfig, HeritageDataItem, CardType } from '../types.ts';
import { THEMES } from '../constants.tsx';
import TimelineView from './visualizations/TimelineView.tsx';
import MapView from './visualizations/MapView.tsx';
import NetworkView from './visualizations/NetworkView.tsx';
import ChartView from './visualizations/ChartView.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Users, BookOpen } from 'lucide-react';

interface ViewerProps {
  config: SiteConfig;
  data: HeritageDataItem[];
}

const Viewer: React.FC<ViewerProps> = ({ config, data }) => {
  const theme = THEMES[config.theme];
  const [activeSectionId, setActiveSectionId] = useState<string>(config.sections[0]?.id || '');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveSectionId(entry.target.getAttribute('data-section-id') || '');
          }
        });
      },
      { threshold: [0.1, 0.5, 0.9], rootMargin: '-10% 0px -10% 0px' }
    );

    (Object.values(sectionRefs.current) as (HTMLDivElement | null)[]).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [config.sections]);

  const activeSection = config.sections.find(s => s.id === activeSectionId);

  const renderVisualization = () => {
    if (!activeSection) return null;

    switch (activeSection.cardType) {
      case CardType.TIMELINE:
        return <TimelineView data={data} config={activeSection.config} theme={theme} />;
      case CardType.MAP:
        return <MapView data={data} config={activeSection.config} theme={theme} />;
      case CardType.NETWORK:
        return <NetworkView data={data} config={activeSection.config} theme={theme} />;
      case CardType.STATISTICS:
        return <ChartView data={data} config={activeSection.config} theme={theme} />;
      default:
        return <div className="flex items-center justify-center h-full text-zinc-400">Visualization not supported.</div>;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} ${theme.font} transition-colors duration-700`}>
      {/* Header */}
      <header className="h-[70vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight">{config.title}</h1>
          <p className="text-xl md:text-2xl opacity-80 mb-8 max-w-2xl mx-auto italic">{config.subtitle}</p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest uppercase opacity-60">Authored by</span>
            <span className="text-lg font-medium underline underline-offset-8 decoration-1 decoration-current/30">{config.author}</span>
          </div>
        </motion.div>
      </header>

      {/* Scrollytelling Section */}
      <div className="relative flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 relative z-10 px-6 pb-[10vh]">
          {config.sections.map((section) => (
            <div 
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              data-section-id={section.id}
              className={`min-h-[80vh] flex items-center justify-center py-20 transition-opacity duration-500 ${
                activeSectionId === section.id ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <div className={`max-w-lg p-8 rounded-2xl shadow-xl border ${theme.card} backdrop-blur-sm`}>
                <h2 className="text-3xl font-bold mb-6 border-b pb-2 inline-block border-current/20">
                  {section.title}
                </h2>
                <p className="text-lg leading-relaxed whitespace-pre-wrap opacity-90">
                  {section.content}
                </p>
              </div>
            </div>
          ))}

          <div className="min-h-[50vh] flex flex-col justify-end py-20">
             <div className={`max-w-lg p-8 rounded-2xl border ${theme.card} opacity-80`}>
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
                    <Users size={14} /> Credits & Acknowledgments
                  </h3>
                  <p className="text-sm leading-relaxed italic">
                    {config.collaborators || "This project was developed independently using the Chronos Weaver Engine."}
                  </p>
                </div>

                {config.bibliography && config.bibliography.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
                      <BookOpen size={14} /> Select Bibliography
                    </h3>
                    <ul className="space-y-4">
                      {config.bibliography.map((bib) => (
                        <li key={bib.id} className="text-sm leading-relaxed group">
                           {bib.text}
                           {bib.url && <a href={bib.url} target="_blank" rel="noopener noreferrer" className="inline-flex ml-2 opacity-30 hover:opacity-100 transition-opacity"><ExternalLink size={12} /></a>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Sticky Visualization */}
        <div className="hidden md:block w-1/2 h-screen sticky top-0 right-0 overflow-hidden pointer-events-none md:pointer-events-auto">
          <div className="h-full w-full p-8 flex items-center justify-center">
             <div className={`w-full h-[85vh] rounded-3xl overflow-hidden shadow-2xl border ${theme.card} transition-all duration-700 relative`}>
               <AnimatePresence mode="wait">
                 {activeSection && (
                   <motion.div
                      key={activeSectionId}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0"
                   >
                     {renderVisualization()}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>
      </div>

      <footer className="py-20 text-center border-t border-current/10 opacity-60">
        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
        <p className="text-sm italic opacity-80 mb-8">{config.subtitle}</p>
        <div className="text-[9px] uppercase tracking-tighter opacity-40">Powered by Chronos Weaver</div>
      </footer>
    </div>
  );
};

export default Viewer;
