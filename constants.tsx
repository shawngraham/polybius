
import { SiteConfig, ThemeType, CardType } from './types';

export const THEMES: Record<ThemeType, { bg: string; text: string; accent: string; font: string; card: string }> = {
  classic: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'bg-blue-600',
    font: 'font-sans',
    card: 'bg-gray-50 border-gray-200'
  },
  parchment: {
    bg: 'bg-[#f4ead5]',
    text: 'text-[#432e1a]',
    accent: 'bg-[#8b4513]',
    font: 'font-serif',
    card: 'bg-[#ede0c8] border-[#d4c3a3]'
  },
  academic: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    accent: 'bg-zinc-800',
    font: 'font-serif',
    card: 'bg-white border-zinc-300'
  },
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-zinc-100',
    accent: 'bg-amber-500',
    font: 'font-sans',
    card: 'bg-zinc-900 border-zinc-800'
  }
};

export const INITIAL_CONFIG: SiteConfig = {
  title: "The Silk Road Exchange",
  subtitle: "Visualizing 13th Century Commercial Networks",
  author: "Dr. Elena Vance",
  collaborators: "Department of Central Asian Studies, University of Silk Road; Map data provided by the Open Heritage Project.",
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
    }
  ]
};

export const SAMPLE_DATA = [
  { id: 'S1', label: "Samarkand", date: 1210, latitude: 39.65, longitude: 66.97, category: "Trade Hub", connections: ['S2', 'S4'] },
  { id: 'S2', label: "Dunhuang", date: 1225, latitude: 40.14, longitude: 94.66, category: "Cultural Hub", connections: ['S1', 'S3'] },
  { id: 'S3', label: "Khanbaliq", date: 1264, latitude: 39.90, longitude: 116.40, category: "Capital", connections: ['S2'] },
  { id: 'S4', label: "Tabriz", date: 1250, latitude: 38.08, longitude: 46.29, category: "Trade Hub", connections: ['S1', 'S5'] },
  { id: 'S5', label: "Venice", date: 1271, latitude: 45.44, longitude: 12.31, category: "Maritime Power", connections: ['S4'] },
  { id: 'S6', label: "Constantinople", date: 1204, latitude: 41.00, longitude: 28.97, category: "Trade Hub", connections: ['S4', 'S5'] },
];
