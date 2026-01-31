
import React, { useState } from 'react';
import { HeritageDataItem } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const ImageView: React.FC<ImageViewProps> = ({ data, config, theme }) => {
  const imageKey = config.imageKey || 'imageUrl';
  const labelKey = config.labelKey || 'label';
  const descKey = config.descriptionKey || 'description';

  const items = data.filter(d => d[imageKey]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center opacity-50">
        <div>
          <p className="text-lg font-bold mb-2">No Image Data Found</p>
          <p className="text-xs">Ensure the chosen column ("{imageKey}") contains image URLs.</p>
        </div>
      </div>
    );
  }

  const activeItem = items[activeIndex];
  const imageUrl = activeItem[imageKey] as string;

  // Detect IIIF manifest URLs and convert to image URL
  const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
  const resolvedUrl = isIIIF && !imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)
    ? `${imageUrl.replace(/\/$/, '')}/full/800,/0/default.jpg`
    : imageUrl;

  const goNext = () => setActiveIndex(prev => (prev + 1) % items.length);
  const goPrev = () => setActiveIndex(prev => (prev - 1 + items.length) % items.length);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-8 pb-0 flex items-center justify-between">
        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Gallery</h3>
        <span className="text-xs font-bold opacity-40">{activeIndex + 1} / {items.length}</span>
      </div>

      <div className="flex-1 p-8 flex flex-col min-h-0">
        <div className="flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0">
          <img
            src={resolvedUrl}
            alt={activeItem[labelKey]?.toString() || 'Image'}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = 'Failed to load image';
            }}
          />

          {/* Left/Right navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-70 hover:opacity-100 backdrop-blur-sm"
                title="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-70 hover:opacity-100 backdrop-blur-sm"
                title="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-bold">{activeItem[labelKey] || 'Untitled'}</p>
          {activeItem[descKey] && (
            <p className="text-xs opacity-70 mt-1 max-w-md mx-auto">{activeItem[descKey]}</p>
          )}
        </div>

        {items.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {items.map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === activeIndex
                    ? 'border-current opacity-100 scale-110'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <img
                  src={item[imageKey] as string}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-8 pb-4 flex justify-between text-[10px] font-bold opacity-40 uppercase tracking-tighter">
        <span>Source: {imageKey}</span>
        <span>{items.length} image{items.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default ImageView;
