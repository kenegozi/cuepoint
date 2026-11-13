export type TextDirection = 'ltr' | 'rtl' | 'auto';

export type StageId = 'stage-1' | 'stage-2' | 'stage-3';
export const DEFAULT_STAGE_ID: StageId = 'stage-1';
export const AVAILABLE_STAGES: { id: StageId; label: string; description: string }[] = [
  { id: 'stage-1', label: 'Stage 1', description: 'Primary Stage (Default)' },
  { id: 'stage-2', label: 'Stage 2', description: 'Secondary Stage' },
  { id: 'stage-3', label: 'Stage 3', description: 'Tertiary Stage' },
];

export interface StageViewerSettings {
  showChords: boolean;
  showComments: boolean;
  fontSize: number;
  chordScale: number; // relative multiplier for chord size, e.g. 0.85
  slashChordScale: number; // relative multiplier for slash/bass note size, e.g. 0.8
  directionOverride: TextDirection;
}

export const DEFAULT_STAGE_VIEWER_SETTINGS: StageViewerSettings = {
  showChords: true,
  showComments: true,
  fontSize: 26,
  chordScale: 0.85,
  slashChordScale: 0.8,
  directionOverride: 'auto',
};

export const getStageSettingsStorageKey = (stageId: StageId): string =>
  `cuepoint_stage_settings_${stageId}`;

export const loadStageSettings = (stageId: StageId): StageViewerSettings => {
  try {
    const raw = localStorage.getItem(getStageSettingsStorageKey(stageId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STAGE_VIEWER_SETTINGS,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn(`Failed to read settings for ${stageId}`, e);
  }
  return DEFAULT_STAGE_VIEWER_SETTINGS;
};

export const saveStageSettings = (stageId: StageId, settings: StageViewerSettings): void => {
  try {
    localStorage.setItem(getStageSettingsStorageKey(stageId), JSON.stringify(settings));
  } catch (e) {
    console.warn(`Failed to save settings for ${stageId}`, e);
  }
};

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

