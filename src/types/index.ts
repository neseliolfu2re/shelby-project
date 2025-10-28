export interface Note {
  id: number;
  content: string;
  author: string;
  createdAt: number;
  readCount: number;
  shelbyHash: string;
  hasMedia?: boolean;
  mediaHash?: string;
  mediaMime?: string;
  mediaSize?: number;
  thumbnailHash?: string;
}

export interface NoteCreatedEvent {
  id: number;
  author: string;
  content: string;
  shelbyHash: string;
}

export interface NoteReadEvent {
  id: number;
  reader: string;
  newReadCount: number;
}

export interface ShelbyConfig {
  apiKey?: string;
  network: 'local' | 'shelbynet' | 'mainnet';
}

export interface TrendingNote extends Note {
  rank: number;
  trendScore: number;
}
