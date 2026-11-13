import React, { useState, useEffect } from 'react';
import {
  SongParsed,
  StageId,
  DEFAULT_STAGE_ID,
  StageViewerSettings,
  loadStageSettings,
  saveStageSettings,
} from '../types';
import { SongRenderer } from './SongRenderer';
import { ZoomIn, ZoomOut, Music, AlignLeft, Maximize, Minimize, MessageSquare } from 'lucide-react';

interface ViewerWindowProps {
  currentSong: SongParsed | null;
  stageId?: StageId;
}

export const ViewerWindow: React.FC<ViewerWindowProps> = ({
  currentSong,
  stageId = DEFAULT_STAGE_ID,
}) => {
  const [settings, setSettings] = useState<StageViewerSettings>(() => loadStageSettings(stageId));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // When stageId changes, re-read settings for that stage
  useEffect(() => {
    setSettings(loadStageSettings(stageId));
  }, [stageId]);

  const updateSetting = <K extends keyof StageViewerSettings>(
    key: K,
    value: StageViewerSettings[K] | ((prev: StageViewerSettings[K]) => StageViewerSettings[K])
  ) => {
    setSettings((prev) => {
      const resolvedValue =
        typeof value === 'function'
          ? (value as (prev: StageViewerSettings[K]) => StageViewerSettings[K])(prev[key])
          : value;
      const updated = {
        ...prev,
        [key]: resolvedValue,
      };
      saveStageSettings(stageId, updated);
      return updated;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const stageDisplayLabel = stageId.replace('stage-', 'STAGE ');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative select-none">
      {/* Floating or Top Subtle Controls Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur border-b border-zinc-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-black text-amber-500 tracking-wider text-sm uppercase">CUEPOINT</span>
          <span className="text-zinc-600">|</span>
          <span className="text-xs bg-zinc-800 text-amber-400 font-bold px-2 py-0.5 rounded border border-zinc-700 font-mono uppercase tracking-wider">
            {stageDisplayLabel}
          </span>
        </div>

        {/* Font size, display mode, comments, and RTL/LTR controls */}
        <div className="flex items-center gap-2">
          {/* Direction Override Control */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => updateSetting('directionOverride', 'auto')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                settings.directionOverride === 'auto' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Auto direction (from song)"
            >
              Auto
            </button>
            <button
              onClick={() => updateSetting('directionOverride', 'ltr')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                settings.directionOverride === 'ltr' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Force Left-to-Right"
            >
              LTR
            </button>
            <button
              onClick={() => updateSetting('directionOverride', 'rtl')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                settings.directionOverride === 'rtl' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Force Right-to-Left"
            >
              RTL
            </button>
          </div>

          {/* Chords Toggle */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => updateSetting('showChords', false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                !settings.showChords ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Lyrics only"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Lyrics</span>
            </button>
            <button
              onClick={() => updateSetting('showChords', true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                settings.showChords ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Lyrics and Chords"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Chords</span>
            </button>
          </div>

          {/* Comments Toggle */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => updateSetting('showComments', (prev) => !prev)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                settings.showComments ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Toggle cues/comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Cues</span>
            </button>
          </div>

          {/* Font Size Zoom Control */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => updateSetting('fontSize', (f) => Math.max(16, f - 2))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Decrease font size"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-zinc-300 w-8 text-center">{settings.fontSize}</span>
            <button
              onClick={() => updateSetting('fontSize', (f) => Math.min(60, f + 2))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Increase font size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentSong ? (
          <SongRenderer
            song={currentSong}
            fontSize={settings.fontSize}
            showChords={settings.showChords}
            showComments={settings.showComments}
            directionOverride={settings.directionOverride}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 mb-4 animate-pulse">
              <Music className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-300">Standing by for song selection</h2>
            <p className="text-sm text-zinc-500 max-w-sm mt-2">
              Select a song in the Controller window. This display syncs automatically in real-time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

