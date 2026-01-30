
import React from 'react';
import { HeritageDataItem } from '../../types';

interface SingleImageViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const SingleImageView: React.FC<SingleImageViewProps> = ({ data, config, theme }) => {
  const imageKey = config.imageKey || 'imageUrl';
  const labelKey = config.labelKey || 'label';
  const descKey = config.descriptionKey || 'description';
  const itemIndex = config.itemIndex ?? 0;

  const items = data.filter(d => d[imageKey]);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center opacity-50">
        <div>
          <p className="text-lg font-bold mb-2">No Image Data Found</p>
          <p className="text-xs">Ensure the chosen column ("{imageKey}") contains an image URL.</p>
        </div>
      </div>
    );
  }

  const clampedIndex = Math.min(itemIndex, items.length - 1);
  const item = items[clampedIndex];
  const imageUrl = item[imageKey] as string;

  const isIIIF = imageUrl.includes('/iiif/') || imageUrl.includes('iiif.io');
  const resolvedUrl = isIIIF && !imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)
    ? `${imageUrl.replace(/\/$/, '')}/full/800,/0/default.jpg`
    : imageUrl;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-8 pb-0">
        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Image</h3>
      </div>

      <div className="flex-1 p-8 flex flex-col min-h-0">
        <div className="flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner relative min-h-0">
          <img
            src={resolvedUrl}
            alt={item[labelKey]?.toString() || 'Image'}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).alt = 'Failed to load image';
            }}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-bold">{item[labelKey] || 'Untitled'}</p>
          {item[descKey] && (
            <p className="text-xs opacity-70 mt-1 max-w-md mx-auto">{item[descKey]}</p>
          )}
        </div>
      </div>

      <div className="px-8 pb-4 text-[10px] font-bold opacity-40 uppercase tracking-tighter">
        <span>Source: {imageKey} (item {clampedIndex + 1} of {items.length})</span>
      </div>
    </div>
  );
};

export default SingleImageView;
