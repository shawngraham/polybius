
import React, { useState, useEffect, useRef } from 'react';
import { SiteConfig, HeritageDataItem, CardType } from '../types.ts';
import { THEMES } from '../constants.tsx';
import TimelineView from './visualizations/TimelineView.tsx';
import MapView from './visualizations/MapView.tsx';
import NetworkView from './visualizations/NetworkView.tsx';
import ChartView from './visualizations/ChartView.tsx';
import ImageView from './visualizations/ImageView.tsx';
import SingleImageView from './visualizations/SingleImageView.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Users, BookOpen, ChevronDown, Play } from 'lucide-react';

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

  const renderVisualization = (sectionConfig?: any) => {
    const sec = sectionConfig || activeSection;
    if (!sec) return null;

    switch (sec.cardType) {
      case CardType.TIMELINE:
        return <TimelineView data={data} config={sec.config} theme={theme} />;
      case CardType.MAP:
        return <MapView data={data} config={sec.config} theme={theme} />;
      case CardType.NETWORK:
        return <NetworkView data={data} config={sec.config} theme={theme} />;
      case CardType.STATISTICS:
        return <ChartView data={data} config={sec.config} theme={theme} />;
      case CardType.GALLERY:
        return <ImageView data={data} config={sec.config} theme={theme} />;
      case CardType.IMAGE:
        return <SingleImageView data={data} config={sec.config} theme={theme} />;
      default:
        return <div className="flex items-center justify-center h-full text-zinc-400">Visualization not supported.</div>;
    }
  };

  // Parse video embeds from text content
  const parseVideoEmbeds = (text: string) => {
    const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)([\w-]+)[^\s]*)/gi;
    const parts: { type: 'text' | 'video'; content: string; embedUrl?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }

      const fullUrl = match[1];
      const videoId = match[2];
      let embedUrl = '';

      if (fullUrl.includes('youtube.com') || fullUrl.includes('youtu.be')) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (fullUrl.includes('vimeo.com')) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      parts.push({ type: 'video', content: fullUrl, embedUrl });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content: text }];
  };

  const renderTextWithEmbeds = (text: string) => {
    const parts = parseVideoEmbeds(text);
    const hasVideos = parts.some(p => p.type === 'video');

    if (!hasVideos) {
      return <p className="text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap opacity-90">{text}</p>;
    }

    return (
      <div className="space-y-6">
        {parts.map((part, i) => {
          if (part.type === 'video' && part.embedUrl) {
            return (
              <div key={i} className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={part.embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded video"
                />
              </div>
            );
          }
          if (part.content.trim()) {
            return <p key={i} className="text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap opacity-90">{part.content}</p>;
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} ${theme.font} transition-colors duration-700`}>
      <style>{`::selection { background-color: ${theme.accentHex}33; }`}</style>
      {/* Header */}
      <header className="h-[50vh] md:h-[70vh] flex flex-col items-center justify-center text-center px-4 md:px-6 relative overflow-hidden">
        {/* Ghost text effect for playful theme */}
        {config.theme === 'playful' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none" aria-hidden="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
              className="relative w-full h-full overflow-hidden"
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute whitespace-nowrap font-bold"
                  style={{
                    fontSize: `${8 + i * 3}rem`,
                    top: `${10 + i * 18}%`,
                    left: '50%',
                    transform: `translateX(-50%) rotate(${-3 + i * 1.5}deg)`,
                    opacity: 0.03 + i * 0.008,
                    color: theme.accentHex,
                    letterSpacing: `${0.05 + i * 0.02}em`,
                    lineHeight: 1,
                  }}
                >
                  {config.title}
                </div>
              ))}
            </motion.div>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="z-10"
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight">{config.title}</h1>
          <div className="h-1 w-24 rounded-full mx-auto mt-2 mb-4 md:mb-6" style={{ backgroundColor: theme.accentHex }} />
          <p className="text-base sm:text-xl md:text-2xl opacity-80 mb-6 md:mb-8 max-w-2xl mx-auto italic">{config.subtitle}</p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase opacity-60">Authored by</span>
            <span className="text-base sm:text-lg font-medium underline underline-offset-8 decoration-1 decoration-current/30">{config.author}</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={24} className="animate-bounce opacity-40" />
        </motion.div>
      </header>

      {/* Scrollytelling Section */}
      {(() => {
        const isTextActive = activeSection?.cardType === CardType.TEXT;
        const vizAlignClass = activeSection?.vizAlignment === 'left' ? 'justify-start' : activeSection?.vizAlignment === 'right' ? 'justify-end' : 'justify-center';
        return (
      <div className="relative flex flex-col md:flex-row">
        <div className={`relative z-10 px-4 md:px-6 pb-[10vh] transition-all duration-700 ${isTextActive ? 'w-full' : 'w-full md:w-1/2'}`}>
          {config.sections.map((section) => {
            const alignClass = section.alignment === 'right' ? 'justify-end' : section.alignment === 'center' ? 'justify-center' : 'justify-start';
            const isMobileViz = section.cardType !== CardType.TEXT;

            if (section.cardType === CardType.TEXT) {
              const textAlignClass = section.config.textAlign === 'center' ? 'text-center' : section.config.textAlign === 'right' ? 'text-right' : section.config.textAlign === 'justify' ? 'text-justify' : 'text-left';
              const isFull = !section.alignment || section.alignment === 'full';
              const textWidthClass = isFull ? 'w-full' : 'max-w-4xl w-full';
              return (
                <div
                  key={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  data-section-id={section.id}
                  className={`min-h-[60vh] md:min-h-[80vh] flex items-center ${alignClass} py-10 md:py-20 transition-opacity duration-500 ${
                    activeSectionId === section.id ? 'opacity-100' : 'md:opacity-20 opacity-100'
                  }`}
                >
                  <div className={`w-full p-6 sm:p-8 md:p-12 rounded-2xl border border-t-4 ${theme.card} ${theme.cardShadow} backdrop-blur-sm ${textAlignClass}`} style={{ borderTopColor: theme.accentHex }}>
                    <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6 border-b pb-2 inline-block border-current/20 ${theme.headingColor}`}>
                      {section.title}
                    </h2>
                    {renderTextWithEmbeds(section.content)}
                  </div>
                </div>
              );
            }

            return (
              <div key={section.id}>
                <div
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  data-section-id={section.id}
                  className={`min-h-[40vh] md:min-h-[80vh] flex items-center ${alignClass} py-10 md:py-20 transition-opacity duration-500 ${
                    activeSectionId === section.id ? 'opacity-100' : 'md:opacity-20 opacity-100'
                  }`}
                >
                  <div className={`w-full md:max-w-lg p-6 sm:p-8 rounded-2xl border border-t-4 ${theme.card} ${theme.cardShadow} backdrop-blur-sm`} style={{ borderTopColor: theme.accentHex }}>
                    <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6 border-b pb-2 inline-block border-current/20 ${theme.headingColor}`}>
                      {section.title}
                    </h2>
                    <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap opacity-90">
                      {section.content}
                    </p>
                  </div>
                </div>
                {/* Mobile inline visualization */}
                {isMobileViz && (
                  <div className="md:hidden mb-8 -mt-4">
                    <div className={`w-full h-[60vh] rounded-2xl overflow-hidden border ${theme.card} ${theme.cardShadow}`}>
                      {renderVisualization(section)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="min-h-[30vh] md:min-h-[50vh] flex flex-col justify-end py-10 md:py-20">
             <div className={`max-w-lg p-6 sm:p-8 rounded-2xl border ${theme.card} opacity-80`}>
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
                    <Users size={14} /> Credits & Acknowledgments
                  </h3>
                  <p className="text-sm leading-relaxed italic">
                    {config.collaborators || "This project was developed independently using the Polybius Engine."}
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

        {/* Sticky Visualization (desktop only) */}
        <div className={`hidden md:block w-1/2 h-screen sticky top-0 right-0 overflow-hidden pointer-events-none md:pointer-events-auto transition-all duration-700 ${isTextActive ? 'opacity-0 w-0 p-0' : 'opacity-100'}`}>
          <div className={`h-full w-full p-8 flex items-center ${vizAlignClass} transition-all duration-700`}>
             <div className={`w-full h-[85vh] rounded-3xl overflow-hidden border ${theme.card} ${theme.cardShadow} transition-all duration-700 relative`}>
               <AnimatePresence mode="wait">
                 {activeSection && activeSection.cardType !== CardType.TEXT && (
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
        );
      })()}

      <footer className="py-12 md:py-20 text-center opacity-60 px-4">
        <div className="h-px w-32 mx-auto mb-8 md:mb-12" style={{ backgroundColor: theme.accentHex }} />
        <h2 className="text-xl md:text-2xl font-bold mb-2">{config.title}</h2>
        <p className="text-xs sm:text-sm italic opacity-80 mb-8">{config.subtitle}</p>
        <div className="text-[9px] uppercase tracking-tighter opacity-40">Powered by Polybius</div>
      </footer>
    </div>
  );
};

export default Viewer;
