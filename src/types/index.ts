export type TextDirection = 'ltr' | 'rtl' | 'auto';

export interface SetSong {
  fileName: string; // e.g. "hotel-california.chordpro"
  title: string;
}

export interface SetData {
  id: string; // validated ^[a-z0-9-]+$ derived from filename prefix
  title: string;
  comments?: string;
  songs: SetSong[];
}

export interface SongParsed {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  tempo?: string;
  time?: string;
  capo?: string;
  comment?: string;
  rawText: string;
  direction?: 'ltr' | 'rtl';
  sections: SongSection[];
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'other';
  title?: string;
  lines: SongLine[];
}

export interface SongLine {
  items: ChordLyricPair[];
  comment?: string;
}

export interface ChordLyricPair {
  chord: string;
  lyric: string;
}

export interface SyncMessage {
  type: 'SELECT_SONG' | 'SYNC_SET' | 'DISPLAY_PREFERENCES';
  set?: SetData;
  song?: SongParsed;
  songId?: string;
  songIndex?: number;
  fontSize?: number;
  showChords?: boolean;
  direction?: 'ltr' | 'rtl';
  timestamp: number;
}

