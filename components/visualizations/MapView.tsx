
import React, { useEffect, useRef } from 'react';
import { HeritageDataItem } from '../../types';
// Import MapIcon from lucide-react
import { Map as MapIcon } from 'lucide-react';

interface MapViewProps {
  data: HeritageDataItem[];
  config: any;
  theme: any;
}

const MapView: React.FC<MapViewProps> = ({ data, config, theme }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const latKey = config.latKey || 'latitude';
  const lngKey = config.lngKey || 'longitude';
  const labelKey = config.labelKey || 'label';
  const baseMap = config.baseMap || 'terrain';
  const defaultLat = config.defaultLat !== undefined && config.defaultLat !== '' ? Number(config.defaultLat) : undefined;
  const defaultLng = config.defaultLng !== undefined && config.defaultLng !== '' ? Number(config.defaultLng) : undefined;
  const defaultZoom = config.defaultZoom !== undefined && config.defaultZoom !== '' ? Number(config.defaultZoom) : undefined;

  const validPoints = data.filter(d =>
    d[latKey] !== undefined &&
    d[lngKey] !== undefined &&
    !isNaN(Number(d[latKey])) &&
    !isNaN(Number(d[lngKey]))
  );

  const tileLayers = {
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    toner: 'https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  const attributions = {
    terrain: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    toner: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
    voyager: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      // Cast window to any to access Leaflet 'L' property and fix TypeScript error
      const L = (window as any).L;
      if (!L) return;

      const initLat = defaultLat !== undefined ? defaultLat : 20;
      const initLng = defaultLng !== undefined ? defaultLng : 0;
      const initZoom = defaultZoom !== undefined ? defaultZoom : 2;

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initLat, initLng], initZoom);

      // Add custom zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

      // Add attribution to bottom left
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapInstanceRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    // Cast window to any to access Leaflet 'L' property and fix TypeScript error
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;

    // Remove existing tile layers and points
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    layers.clearLayers();

    // Set new Tile Layer
    const url = tileLayers[baseMap as keyof typeof tileLayers] || tileLayers.voyager;
    const attr = attributions[baseMap as keyof typeof attributions] || attributions.voyager;

    L.tileLayer(url, { attribution: attr }).addTo(map);

    // Add Points
    if (validPoints.length > 0) {
      const markers: any[] = [];
      validPoints.forEach(point => {
        const marker = L.circleMarker([Number(point[latKey]), Number(point[lngKey])], {
          radius: 6,
          fillColor: theme.accent.includes('indigo') ? '#4f46e5' :
                     theme.accent.includes('amber') ? '#f59e0b' : '#8b4513',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });

        marker.bindTooltip(point[labelKey]?.toString() || "Untitled Item", {
          permanent: false,
          direction: 'top',
          className: 'dh-tooltip'
        });

        marker.addTo(layers);
        markers.push(marker);
      });

      // If user set a default center and zoom, use those; otherwise fit bounds
      if (defaultLat !== undefined && defaultLng !== undefined && defaultZoom !== undefined) {
        map.setView([defaultLat, defaultLng], defaultZoom);
      } else {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }

    // Fix map resize issues
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [data, config, theme, baseMap, latKey, lngKey, labelKey, defaultLat, defaultLng, defaultZoom]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-8 pb-4 flex items-center justify-between">
         <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Spatial Context</h3>
         <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
           <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse"></span>
           Live Geopositioning Enabled
         </div>
      </div>

      <div className="flex-1 relative m-8 mt-0 rounded-2xl overflow-hidden border border-current/10 shadow-inner bg-zinc-50">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Overlay HUD */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
           <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
             <span className="text-[10px] font-bold uppercase text-zinc-500 block">Projection</span>
             <span className="text-xs font-semibold text-zinc-800">Spherical Mercator</span>
           </div>
        </div>

        {validPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 backdrop-blur-sm z-[1001]">
            <div className="text-center p-8">
              <MapIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-500">No geographic data columns mapped.</p>
              <p className="text-xs text-zinc-400 mt-2">Configure Latitude and Longitude in the Editor.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
