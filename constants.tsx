
import { SiteConfig, ThemeType, CardType } from './types';

export const THEMES: Record<ThemeType, { bg: string; text: string; accent: string; font: string; card: string; headingColor: string; accentHex: string; cardShadow: string }> = {
  classic: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'bg-blue-600',
    font: 'font-sans',
    card: 'bg-gray-50 border-gray-200',
    headingColor: 'text-gray-900',
    accentHex: '#2563eb',
    cardShadow: 'shadow-xl'
  },
  parchment: {
    bg: 'bg-[#f4ead5]',
    text: 'text-[#432e1a]',
    accent: 'bg-[#8b4513]',
    font: 'font-serif',
    card: 'bg-[#ede0c8] border-[#d4c3a3]',
    headingColor: 'text-[#6b3410]',
    accentHex: '#8b4513',
    cardShadow: 'shadow-xl'
  },
  academic: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    accent: 'bg-zinc-800',
    font: 'font-serif',
    card: 'bg-white border-zinc-300',
    headingColor: 'text-zinc-900',
    accentHex: '#27272a',
    cardShadow: 'shadow-xl'
  },
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-zinc-100',
    accent: 'bg-amber-500',
    font: 'font-sans',
    card: 'bg-zinc-900 border-zinc-800',
    headingColor: 'text-amber-400',
    accentHex: '#f59e0b',
    cardShadow: 'shadow-lg ring-1 ring-white/5'
  },
  highcontrast: {
    bg: 'bg-white',
    text: 'text-black',
    accent: 'bg-blue-700',
    font: 'font-sans',
    card: 'bg-white border-black',
    headingColor: 'text-black',
    accentHex: '#1d4ed8',
    cardShadow: 'shadow-xl'
  },
  maritime: {
    bg: 'bg-[#0b1a2e]',
    text: 'text-[#c9daea]',
    accent: 'bg-[#d4a017]',
    font: 'font-serif',
    card: 'bg-[#122240] border-[#1e3a5f]',
    headingColor: 'text-[#e8b828]',
    accentHex: '#d4a017',
    cardShadow: 'shadow-lg ring-1 ring-white/5'
  },
  forest: {
    bg: 'bg-[#f0ebe3]',
    text: 'text-[#2d3a2e]',
    accent: 'bg-[#5a7247]',
    font: 'font-serif',
    card: 'bg-[#e8e0d4] border-[#c4b9a8]',
    headingColor: 'text-[#3d5230]',
    accentHex: '#5a7247',
    cardShadow: 'shadow-xl'
  },
  playful: {
    bg: 'bg-[#1a1025]',
    text: 'text-[#e8dff0]',
    accent: 'bg-[#e85d75]',
    font: 'font-sans',
    card: 'bg-[#251438]/80 border-[#3d2655]',
    headingColor: 'text-[#f0a1b3]',
    accentHex: '#e85d75',
    cardShadow: 'shadow-lg ring-1 ring-white/5'
  }
};

export const INITIAL_CONFIG: SiteConfig = {
  title: "The Silk Road Exchange",
  subtitle: "Visualizing 13th Century Commercial Networks",
  author: "Dr. John Doe",
  collaborators: "Department of Central Asian Studies, Miskatonic; Map data provided by the Miskatonic Cthulic Heritage Project.",
  bibliography: [
    { id: 'b1', text: "Polo, Marco. 'The Travels of Marco Polo'. 13th Century Manuscript.", url: "" },
    { id: 'b2', text: "Bentley, Jerry H. 'Old World Encounters'. Oxford University Press, 1993.", url: "https://example.edu/bentley-dh" }
  ],
  theme: "parchment",
  sections: [
    {
      id: '1',
      title: "Introduction",
      content: "Between the 2nd century BCE and the 18th century CE, a network of trade routes connected the East and West. This site explores the specific commodities and connections during the Mongol ascendancy.",
      cardType: CardType.STATISTICS,
      config: { dataKey: 'category' }
    },
    {
      id: '2',
      title: "The Great Cities",
      content: "Samarkand, Merv, and Dunhuang were more than just rest stops; they were intellectual hubs where Buddhism, Islam, and Nestorian Christianity met and exchanged ideas.",
      cardType: CardType.MAP,
      config: { latKey: 'latitude', lngKey: 'longitude', labelKey: 'label' }
    },
    {
      id: '3',
      title: "The Flow of Time",
      content: "Major caravansarai were established during the 1200s, marking a golden age of secure travel under the Pax Mongolica.",
      cardType: CardType.TIMELINE,
      config: { dateKey: 'date' }
    },
    {
      id: '4',
      title: "Interconnected Worlds",
      content: "Diplomatic missions often accompanied trade. The connections between the Yuan court and the Ilkhanate were particularly robust.",
      cardType: CardType.NETWORK,
      config: { sourceKey: 'label', connectionsKey: 'connections' }
    },
    {
      id: '5',
      title: "Monuments of Exchange",
      content: "The great cities of the Silk Road left behind architectural marvels that still stand as testaments to centuries of cultural exchange and artistic synthesis.",
      cardType: CardType.GALLERY,
      config: { imageKey: 'imageUrl', labelKey: 'label', descriptionKey: 'description' }
    }
  ]
};

export const SAMPLE_DATA = [
  { id: 'S1', label: "Samarkand", date: 1210, latitude: 39.65, longitude: 66.97, category: "Trade Hub", connections: ['S2', 'S4'], description: "A jewel of the Silk Road and center of Islamic scholarship.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Registan_-_Pair.jpg/800px-Registan_-_Pair.jpg" },
  { id: 'S2', label: "Dunhuang", date: 1225, latitude: 40.14, longitude: 94.66, category: "Cultural Hub", connections: ['S1', 'S3'], description: "Gateway to the Mogao Caves, a treasury of Buddhist art.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Dunhuang_Mogao_Ku_2013.12.31_13-07-36.jpg/800px-Dunhuang_Mogao_Ku_2013.12.31_13-07-36.jpg" },
  { id: 'S3', label: "Khanbaliq", date: 1264, latitude: 39.90, longitude: 116.40, category: "Capital", connections: ['S2'], description: "Capital of the Yuan dynasty under Kublai Khan.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/YuanEmperorAlbumGenghisPortrait.jpg/440px-YuanEmperorAlbumGenghisPortrait.jpg" },
  { id: 'S4', label: "Tabriz", date: 1250, latitude: 38.08, longitude: 46.29, category: "Trade Hub", connections: ['S1', 'S5'], description: "Ilkhanate capital and crossroads of East-West commerce.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Blue_mosque_Tabriz.jpg/800px-Blue_mosque_Tabriz.jpg" },
  { id: 'S5', label: "Venice", date: 1271, latitude: 45.44, longitude: 12.31, category: "Maritime Power", connections: ['S4'], description: "Maritime republic and departure point for Marco Polo.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Venezia_Panorama_%28cropped%29.jpg/800px-Venezia_Panorama_%28cropped%29.jpg" },
  { id: 'S6', label: "Constantinople", date: 1204, latitude: 41.00, longitude: 28.97, category: "Trade Hub", connections: ['S4', 'S5'], description: "Byzantine capital bridging Europe and Asia.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Hagia-Sophia-Innenansicht.jpg/800px-Hagia-Sophia-Innenansicht.jpg" },
];
