import React, { useState, useRef, useEffect } from 'react';
import { SetData, SetSong, SongParsed, TextDirection, StageId, AVAILABLE_STAGES } from '../types';
import { 
  Play, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Save, 
  FolderOpen, 
  ExternalLink, 
  Settings, 
  FileText,
  AlertCircle,
  Edit3,
  Tv
} from 'lucide-react';
import { SongEditorModal } from './SongEditorModal';

interface ControllerWindowProps {
  set: SetData;
  activeSongIndex: number;
  activeSongParsed: SongParsed | null;
  controllerDirection?: TextDirection;
  onSelectSong: (index: number) => void;
  onReorderSongs: (reordered: SetSong[]) => void;
  onAddSong: (songId: string, title: string) => void;
  onSaveSongFile: (fileName: string, content: string) => Promise<void>;
  onSaveSet: () => void;
  onOpenFolderPicker: () => void;
  onOpenSettings: () => void;
  onOpenViewerWindow: (stageId: StageId) => void;
  isSaving: boolean;
  statusMessage?: string;
  errorMessage?: string;
}

export const ControllerWindow: React.FC<ControllerWindowProps> = ({
  set,
  activeSongIndex,
  activeSongParsed,
  controllerDirection = 'ltr',
  onSelectSong,
  onReorderSongs,
  onAddSong,
  onSaveSongFile,
  onSaveSet,
  onOpenFolderPicker,
  onOpenSettings,
  onOpenViewerWindow,
  isSaving,
  statusMessage,
  errorMessage,
}) => {
  const isRTL = controllerDirection === 'rtl';
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const stageMenuRef = useRef<HTMLDivElement>(null);
  const [newSongId, setNewSongId] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [addError, setAddError] = useState('');

  // Close stage dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stageMenuRef.current && !stageMenuRef.current.contains(event.target as Node)) {
        setShowStageMenu(false);
      }
    };
    if (showStageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStageMenu]);

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= set.songs.length) return;

    const updated = [...set.songs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderSongs(updated);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newSongId.trim().toLowerCase();
    const cleanTitle = newSongTitle.trim();

    if (!cleanId || !cleanTitle) {
      setAddError('Both Song ID and Title are required.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanId)) {
      setAddError('Song ID may only contain lowercase letters (a-z), digits (0-9), and hyphens (-).');
      return;
    }

    if (set.songs.some((s) => s.fileName === `${cleanId}.chordpro`)) {
      setAddError('A song with this ID already exists in the set.');
      return;
    }

    onAddSong(cleanId, cleanTitle);
    setShowAddModal(false);
    setNewSongId('');
    setNewSongTitle('');
    setAddError('');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-black text-amber-500 tracking-wider text-lg">CUEPOINT</span>
          <span className="text-zinc-600">/</span>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">{set.title}</h1>
            <p className="text-xs text-zinc-400 font-mono">Set ID: {set.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFolderPicker}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-zinc-700"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch Folder</span>
          </button>

          {/* Multi-stage launcher button & dropdown */}
          <div className="relative" ref={stageMenuRef}>
            <div className="inline-flex rounded-lg shadow">
              <button
                onClick={() => onOpenViewerWindow('stage-1')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-l-lg flex items-center gap-1.5 transition"
                title="Open Stage 1 (Default)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Stage 1</span>
              </button>
              <button
                onClick={() => setShowStageMenu((prev) => !prev)}
                className="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-black border-l border-amber-700/30 text-xs font-bold rounded-r-lg flex items-center transition"
                title="Select stage to open"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStageMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showStageMenu && (
              <div
                className={`absolute top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 ${
                  isRTL ? 'left-0' : 'right-0'
                }`}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-500" />
                  <span>Open Stage Viewers</span>
                </div>
                {AVAILABLE_STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      onOpenViewerWindow(stage.id);
                      setShowStageMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center justify-between transition group"
                  >
                    <div>
                      <span className="font-semibold text-amber-400">{stage.label}</span>
                      <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">{stage.description}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onSaveSet}
            disabled={isSaving}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-zinc-700"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Save Set'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition border border-zinc-700"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="bg-rose-950/70 border-b border-rose-800 text-rose-200 px-6 py-2.5 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="bg-emerald-950/60 border-b border-emerald-800 text-emerald-200 px-6 py-2 text-xs font-mono">
          {statusMessage}
        </div>
      )}

      {/* Two Column Layout: Setlist Navigation & Song Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Setlist Column (Left in LTR, Right in RTL) */}
        <section className={`w-96 ${isRTL ? 'border-l' : 'border-r'} border-zinc-800 flex flex-col bg-zinc-950/50`}>
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              SETLIST ({set.songs.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold rounded flex items-center gap-1 border border-zinc-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Song</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {set.songs.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-sm">
                No songs in this set yet. Click "Add Song" to begin.
              </div>
            ) : (
              set.songs.map((song, idx) => {
                const isActive = idx === activeSongIndex;
                return (
                  <div
                    key={song.fileName}
                    className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                      isActive
                        ? isRTL
                          ? 'bg-amber-500/10 border-r-4 border-amber-500 text-white'
                          : 'bg-amber-500/10 border-l-4 border-amber-500 text-white'
                        : 'hover:bg-zinc-900/60 text-zinc-300'
                    }`}
                    onClick={() => onSelectSong(idx)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-zinc-500 w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <p className={`font-semibold text-sm truncate ${isActive ? 'text-amber-400' : ''}`}>
                          {song.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">{song.fileName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSong(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 hover:bg-zinc-800 rounded"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSong(idx, 'down');
                        }}
                        disabled={idx === set.songs.length - 1}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 hover:bg-zinc-800 rounded"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Song Inspector & Metadata */}
        <section className="flex-1 flex flex-col bg-zinc-900/20 overflow-y-auto p-6">
          {activeSongParsed ? (
            <div className="max-w-3xl space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold">
                    ACTIVE ON STAGE
                  </span>
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700">
                    STAGE DIR: {(activeSongParsed.direction || 'ltr').toUpperCase()}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white mt-1">{activeSongParsed.title}</h2>
                {activeSongParsed.artist && (
                  <p className="text-zinc-400 font-medium text-lg">{activeSongParsed.artist}</p>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">KEY</span>
                  <span className="text-base font-bold text-zinc-200">{activeSongParsed.key || '—'}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">TEMPO</span>
                  <span className="text-base font-bold text-zinc-200">
                    {activeSongParsed.tempo ? `${activeSongParsed.tempo} BPM` : '—'}
                  </span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">TIME</span>
                  <span className="text-base font-bold text-zinc-200">{activeSongParsed.time || '—'}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">CAPO</span>
                  <span className="text-base font-bold text-amber-400">{activeSongParsed.capo || '—'}</span>
                </div>
              </div>

              {/* Raw ChordPro Preview / File Reference */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    {set.songs[activeSongIndex]?.fileName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{activeSongParsed.sections.length} sections parsed</span>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-sans font-semibold text-xs flex items-center gap-1.5 transition"
                      title="Edit ChordPro file"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <pre
                  dir={activeSongParsed.direction === 'rtl' ? 'rtl' : 'ltr'}
                  className="text-xs font-mono text-zinc-400 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-black/40 p-3 rounded border border-zinc-950 text-start"
                >
                  {activeSongParsed.rawText}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Play className="w-10 h-10 mb-2 opacity-30" />
              <p>Select a song from the list to preview metadata and broadcast to stage viewers</p>
            </div>
          )}
        </section>
      </div>

      {/* Add Song Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add New Song to Set</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter the song details. A new <code className="text-amber-400">.chordpro</code> file will be created.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Song ID (Filename prefix)
                </label>
                <div className="flex items-center" dir="ltr">
                  <input
                    type="text"
                    value={newSongId}
                    onChange={(e) => setNewSongId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. hotel-california"
                    required
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-l px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="bg-zinc-800 border border-l-0 border-zinc-700 text-zinc-400 px-2.5 py-2 text-xs font-mono rounded-r">
                    .chordpro
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  Lowercase a-z, 0-9, and hyphens only
                </span>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">Song Title</label>
                <input
                  type="text"
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  placeholder="e.g. Hotel California"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {addError && <p className="text-xs text-rose-400">{addError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded transition"
                >
                  Create & Add Song
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      {showEditModal && activeSongParsed && (
        <SongEditorModal
          isOpen={showEditModal}
          fileName={set.songs[activeSongIndex]?.fileName || `${activeSongParsed.id}.chordpro`}
          initialContent={activeSongParsed.rawText}
          onClose={() => setShowEditModal(false)}
          onSave={onSaveSongFile}
        />
      )}
    </div>
  );
};

