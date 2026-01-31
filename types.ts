
export type ThemeType = 'classic' | 'parchment' | 'academic' | 'dark' | 'highcontrast' | 'maritime' | 'forest' | 'playful';

export enum CardType {
  TIMELINE = 'TIMELINE',
  MAP = 'MAP',
  NETWORK = 'NETWORK',
  STATISTICS = 'STATISTICS',
  GALLERY = 'GALLERY',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT'
}

export type CardAlignment = 'left' | 'center' | 'right' | 'full';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface BibliographyEntry {
  id: string;
  text: string;
  url?: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  cardType: CardType;
  alignment?: CardAlignment;
  vizAlignment?: CardAlignment;
  config: Record<string, any>;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  author: string;
  collaborators: string;
  bibliography: BibliographyEntry[];
  theme: ThemeType;
  sections: Section[];
}

export interface HeritageDataItem {
  id: string | number;
  label: string;
  date?: string | number;
  latitude?: number;
  longitude?: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  connections?: string[]; // IDs of related items
  [key: string]: any;
}
