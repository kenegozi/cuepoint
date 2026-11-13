import React, { useState, useEffect, useCallback } from 'react';
import { SetData, SetSong, SongParsed, SyncMessage, TextDirection, StageId, DEFAULT_STAGE_ID } from './types';
import { ControllerWindow } from './components/ControllerWindow';
import { ViewerWindow } from './components/ViewerWindow';
import { SettingsModal } from './components/SettingsModal';
import { parseChordPro } from './utils/chordpro';
import { syncService } from './services/syncService';
import { storageService } from './services/storageService';
import { googleDriveService } from './services/googleDriveService';
import { DEMO_SET, DEMO_SONGS } from './demoData';
import { FolderPlus } from 'lucide-react';

export function App() {
  // Check if current tab is explicitly opened as a viewer
  const [isViewerMode] = useState<boolean>(() => {
    return (
      window.location.search.includes('mode=viewer') ||
      window.location.search.includes('stage=') ||
      window.location.hash.startsWith('#viewer')
    );
  });

  // Determine stageId from URL (?stage=stage-2 or #viewer:stage-2 or #viewer/stage-2)
  const [currentStageId] = useState<StageId>(() => {
    const params = new URLSearchParams(window.location.search);
    const stageParam = params.get('stage');
    if (stageParam === 'stage-1' || stageParam === 'stage-2' || stageParam === 'stage-3') {
      return stageParam;
    }

    const hash = window.location.hash;
    const match = hash.match(/#(?:viewer[:/])?(stage-[123])/);
    if (match && (match[1] === 'stage-1' || match[1] === 'stage-2' || match[1] === 'stage-3')) {
      return match[1];
    }

    return DEFAULT_STAGE_ID;
  });

  const [activeSet, setActiveSet] = useState<SetData>(DEMO_SET);
  const [activeSongIndex, setActiveSongIndex] = useState<number>(0);
  const [activeSongParsed, setActiveSongParsed] = useState<SongParsed | null>(null);

  // Controller UI direction preference (saved in localStorage)
  const [controllerDirection, setControllerDirection] = useState<TextDirection>(() => {
    const saved = localStorage.getItem('cuepoint_controller_direction');
    if (saved === 'rtl' || saved === 'ltr' || saved === 'auto') return saved;
    return 'ltr';
  });

  // Effective layout direction for Controller (resolves 'auto' using browser language)
  const effectiveControllerDir: 'ltr' | 'rtl' =
    controllerDirection === 'auto'
      ? /^(he|ar|fa|ur)/i.test(navigator.language)
        ? 'rtl'
        : 'ltr'
      : controllerDirection;

  const handleControllerDirectionChange = (newDir: TextDirection) => {
    setControllerDirection(newDir);
    localStorage.setItem('cuepoint_controller_direction', newDir);
  };

  const [folderId, setFolderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Set creation dialog when 0 cuepoint files found
  const [showNewSetModal, setShowNewSetModal] = useState(false);
  const [pendingFolder, setPendingFolder] = useState<{ id: string; name: string } | null>(null);
  const [newSetId, setNewSetId] = useState('');
  const [newSetTitle, setNewSetTitle] = useState('');

  // Pre-seed demo songs into cache if empty, or load last active set from localStorage
  useEffect(() => {
    async function initStorage() {
      // Check if there is an active set saved in localStorage
      const lastSetId = localStorage.getItem('cuepoint_active_set_id');
      if (lastSetId) {
        const cachedActive = await storageService.getSet(lastSetId);
        if (cachedActive) {
          setActiveSet(cachedActive);
          loadSongAtIndex(0, cachedActive);
          return;
        }
      }

      const cached = await storageService.getSet(DEMO_SET.id);
      if (!cached) {
        await storageService.saveSet(DEMO_SET);
        for (const [fn, content] of Object.entries(DEMO_SONGS)) {
          await storageService.saveSongFile(fn, content);
        }
      }
      loadSongAtIndex(0, DEMO_SET);
    }
    initStorage();
  }, []);

  // Load song content for active index
  const loadSongAtIndex = useCallback(
    async (index: number, set: SetData = activeSet) => {
      if (!set.songs || index < 0 || index >= set.songs.length) {
        setActiveSongParsed(null);
        return;
      }
      const songMeta = set.songs[index];
      const songId = songMeta.fileName.replace(/\.chordpro$/, '');

      // 1. Try local cache
      let raw = await storageService.getSongFile(songMeta.fileName);

      // 2. Fall back to demo songs if available
      if (!raw && DEMO_SONGS[songMeta.fileName]) {
        raw = DEMO_SONGS[songMeta.fileName];
        await storageService.saveSongFile(songMeta.fileName, raw);
      }

      // 3. Fall back to minimal template if new
      if (!raw) {
        raw = `{title: ${songMeta.title}}\n\n[C]New song chordpro file`;
      }

      const parsed = parseChordPro(raw, songId);
      setActiveSongIndex(index);
      setActiveSongParsed(parsed);
    },
    [activeSet]
  );

  // Initial load
  useEffect(() => {
    loadSongAtIndex(0, activeSet);
  }, []);

  // Listen for sync messages from Controller
  useEffect(() => {
    const unsubscribe = syncService.subscribe(async (msg: SyncMessage) => {
      if (msg.type === 'SYNC_SET' && msg.set) {
        setActiveSet(msg.set);
        localStorage.setItem('cuepoint_active_set_id', msg.set.id);
        if (msg.song) {
          setActiveSongParsed(msg.song);
          if (typeof msg.songIndex === 'number') {
            setActiveSongIndex(msg.songIndex);
          }
        } else if (typeof msg.songIndex === 'number') {
          loadSongAtIndex(msg.songIndex, msg.set);
        }
      } else if (msg.type === 'SELECT_SONG') {
        if (msg.song) {
          setActiveSongParsed(msg.song);
          if (typeof msg.songIndex === 'number') {
            setActiveSongIndex(msg.songIndex);
          }
        } else if (typeof msg.songIndex === 'number') {
          loadSongAtIndex(msg.songIndex);
        }
      }
    });
    return unsubscribe;
  }, [loadSongAtIndex]);

  // Handle song selection by Controller
  const handleSelectSong = async (index: number) => {
    await loadSongAtIndex(index);
    const songMeta = activeSet.songs[index];
    let parsed: SongParsed | null = null;
    if (songMeta) {
      const raw = await storageService.getSongFile(songMeta.fileName);
      if (raw) {
        parsed = parseChordPro(raw, songMeta.fileName.replace(/\.chordpro$/, ''));
      }
    }

    syncService.broadcast({
      type: 'SELECT_SONG',
      songIndex: index,
      songId: activeSet.songs[index]?.fileName,
      song: parsed || undefined,
      direction: parsed?.direction,
    });
  };

  // Open Stage Viewer in a separate clean window with specific stage target
  const handleOpenViewerWindow = (stageId: StageId = DEFAULT_STAGE_ID) => {
    const url = `${window.location.origin}${window.location.pathname}?mode=viewer&stage=${stageId}`;
    window.open(url, `CuePointViewer_${stageId}`, 'width=1024,height=768');
  };

  // Reorder songs in setlist
  const handleReorderSongs = (reordered: SetSong[]) => {
    const updated: SetData = { ...activeSet, songs: reordered };
    setActiveSet(updated);
    storageService.saveSet(updated);
  };

  // Add new song to set
  const handleAddSong = async (songId: string, title: string) => {
    const fileName = `${songId}.chordpro`;
    const initialContent = `{title: ${title}}\n\n[C]Start typing lyrics and chords\n`;

    // 1. Save locally in cache
    await storageService.saveSongFile(fileName, initialContent);

    // 2. If folderId is connected, save to Google Drive
    if (folderId) {
      try {
        await googleDriveService.saveFileToFolder(folderId, fileName, initialContent);
      } catch (err: any) {
        setErrorMessage(`Saved locally, but failed to write to Google Drive: ${err.message}`);
      }
    }

    const updatedSongs = [...activeSet.songs, { fileName, title }];
    const updatedSet: SetData = { ...activeSet, songs: updatedSongs };
    setActiveSet(updatedSet);
    await storageService.saveSet(updatedSet);

    if (folderId) {
      const setFileName = `${activeSet.id}.cuepoint.json`;
      await googleDriveService
        .saveFileToFolder(folderId, setFileName, JSON.stringify(updatedSet, null, 2), 'application/json')
        .catch(console.error);
    }

    // Automatically select the new song
    handleSelectSong(updatedSongs.length - 1);
  };

  // Save edited song file (Drive + Local Cache + Viewer update)
  const handleSaveSongFile = async (fileName: string, content: string) => {
    // 1. Save to local cache
    await storageService.saveSongFile(fileName, content);

    // 2. If folderId is connected, save to Google Drive
    if (folderId) {
      try {
        await googleDriveService.saveFileToFolder(folderId, fileName, content);
      } catch (err: any) {
        setErrorMessage(`Saved locally, but failed to write to Google Drive: ${err.message}`);
      }
    }

    // 3. Update active song if this is the active song
    const songId = fileName.replace(/\.chordpro$/, '');
    const currentActiveSong = activeSet.songs[activeSongIndex];

    if (currentActiveSong && currentActiveSong.fileName === fileName) {
      const parsed = parseChordPro(content, songId);
      setActiveSongParsed(parsed);

      // If title changed in the chordpro file, update set metadata
      if (parsed.title && parsed.title !== currentActiveSong.title) {
        const updatedSongs = [...activeSet.songs];
        updatedSongs[activeSongIndex] = { ...currentActiveSong, title: parsed.title };
        const updatedSet = { ...activeSet, songs: updatedSongs };
        setActiveSet(updatedSet);
        await storageService.saveSet(updatedSet);
        if (folderId) {
          const setFileName = `${activeSet.id}.cuepoint.json`;
          googleDriveService
            .saveFileToFolder(folderId, setFileName, JSON.stringify(updatedSet, null, 2), 'application/json')
            .catch(console.error);
        }
      }

      // Broadcast update to viewer windows
      syncService.broadcast({
        type: 'SELECT_SONG',
        songIndex: activeSongIndex,
        songId: fileName,
        song: parsed,
        direction: parsed.direction,
      });
    }

    setStatusMessage(`Saved "${fileName}" successfully.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Save full set
  const handleSaveSet = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await storageService.saveSet(activeSet);
      if (folderId) {
        const setFileName = `${activeSet.id}.cuepoint.json`;
        await googleDriveService.saveFileToFolder(
          folderId,
          setFileName,
          JSON.stringify(activeSet, null, 2),
          'application/json'
        );
      }
      setStatusMessage('Set saved successfully to offline cache & Drive.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(`Failed to save set: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Pick Google Drive Folder & Enforce Defensive Logic
  const handleOpenFolderPicker = () => {
    setErrorMessage('');
    googleDriveService.openFolderPicker(
      async (folder) => {
        try {
          setStatusMessage(`Inspecting folder "${folder.name}"...`);
          const files = await googleDriveService.listFolderFiles(folder.id);

          // Find *.cuepoint.json files
          const cuepointFiles = files.filter((f) => f.name.endsWith('.cuepoint.json'));

          if (cuepointFiles.length > 1) {
            setErrorMessage(
              `Error: Found ${cuepointFiles.length} cuepoint.json files in this folder. Only 1 set per folder is permitted.`
            );
            setStatusMessage('');
            return;
          }

          setFolderId(folder.id);

          if (cuepointFiles.length === 1) {
            // Load existing set
            const targetFile = cuepointFiles[0];
            const content = await googleDriveService.getFileContent(targetFile.id);
            const parsedSet: SetData = JSON.parse(content);

            // Enforce ID strictly derived from filename
            const derivedId = targetFile.name.replace(/\.cuepoint\.json$/, '');
            parsedSet.id = derivedId;

            // Cache & sync song files from this folder
            for (const song of parsedSet.songs) {
              const matchingDriveFile = files.find((f) => f.name === song.fileName);
              if (matchingDriveFile) {
                const songContent = await googleDriveService.getFileContent(matchingDriveFile.id);
                await storageService.saveSongFile(song.fileName, songContent);
              }
            }

            await storageService.saveSet(parsedSet);
            localStorage.setItem('cuepoint_active_set_id', parsedSet.id);
            setActiveSet(parsedSet);
            setStatusMessage(`Loaded set "${parsedSet.title}" from Google Drive.`);

            // Load first song
            let firstParsed: SongParsed | null = null;
            if (parsedSet.songs.length > 0) {
              const firstSongMeta = parsedSet.songs[0];
              const rawFirst = await storageService.getSongFile(firstSongMeta.fileName);
              if (rawFirst) {
                firstParsed = parseChordPro(rawFirst, firstSongMeta.fileName.replace(/\.chordpro$/, ''));
              }
              setActiveSongIndex(0);
              setActiveSongParsed(firstParsed);
            }

            // Broadcast newly loaded set and first song to all Viewer windows
            syncService.broadcast({
              type: 'SYNC_SET',
              set: parsedSet,
              songIndex: 0,
              song: firstParsed || undefined,
            });

            setTimeout(() => setStatusMessage(''), 3500);
          } else {
            // Zero cuepoint files found -> Prompt user to create new set
            setPendingFolder(folder);
            setNewSetId(folder.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'band-set');
            setNewSetTitle(folder.name);
            setShowNewSetModal(true);
            setStatusMessage('');
          }
        } catch (err: any) {
          setErrorMessage(`Drive Error: ${err.message}`);
          setStatusMessage('');
        }
      },
      (err) => {
        setErrorMessage(typeof err === 'string' ? err : err?.message || 'Google Picker Error');
      }
    );
  };

  // Create new set in folder
  const handleCreateNewSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFolder) return;

    const cleanId = newSetId.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanId)) {
      setErrorMessage('Set ID may only contain lowercase letters (a-z), digits (0-9), and hyphens (-).');
      return;
    }

    const newSet: SetData = {
      id: cleanId,
      title: newSetTitle.trim() || 'New Set',
      songs: [],
    };

    try {
      const fileName = `${cleanId}.cuepoint.json`;
      await googleDriveService.saveFileToFolder(
        pendingFolder.id,
        fileName,
        JSON.stringify(newSet, null, 2),
        'application/json'
      );
      await storageService.saveSet(newSet);
      localStorage.setItem('cuepoint_active_set_id', newSet.id);
      setActiveSet(newSet);
      setActiveSongIndex(-1);
      setActiveSongParsed(null);
      setShowNewSetModal(false);
      setStatusMessage(`Created new set "${newSet.title}".`);

      syncService.broadcast({
        type: 'SYNC_SET',
        set: newSet,
        songIndex: -1,
      });
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setErrorMessage(`Failed to create set file: ${err.message}`);
    }
  };

  // If this window is dedicated to the stage display
  if (isViewerMode) {
    return <ViewerWindow currentSong={activeSongParsed} stageId={currentStageId} />;
  }

  // Otherwise Controller Window
  return (
    <>
      <ControllerWindow
        set={activeSet}
        activeSongIndex={activeSongIndex}
        activeSongParsed={activeSongParsed}
        controllerDirection={effectiveControllerDir}
        onSelectSong={handleSelectSong}
        onReorderSongs={handleReorderSongs}
        onAddSong={handleAddSong}
        onSaveSongFile={handleSaveSongFile}
        onSaveSet={handleSaveSet}
        onOpenFolderPicker={handleOpenFolderPicker}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenViewerWindow={handleOpenViewerWindow}
        isSaving={isSaving}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        controllerDirection={controllerDirection}
        onControllerDirectionChange={handleControllerDirectionChange}
      />

      {/* New Set Modal when 0 cuepoint files found in picked folder */}
      {showNewSetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <FolderPlus className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Create Set in "{pendingFolder?.name}"</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              No existing <code>*.cuepoint.json</code> was found in this folder. Enter a Set ID and Title to create a new set.
            </p>

            <form onSubmit={handleCreateNewSet} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Set ID (Filename prefix)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newSetId}
                    onChange={(e) => setNewSetId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. tour-setlist-1"
                    required
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-l px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="bg-zinc-800 border border-l-0 border-zinc-700 text-zinc-400 px-2 py-2 text-xs font-mono rounded-r">
                    .cuepoint.json
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">Set Title</label>
                <input
                  type="text"
                  value={newSetTitle}
                  onChange={(e) => setNewSetTitle(e.target.value)}
                  placeholder="e.g. Summer Tour 2026"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSetModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded"
                >
                  Create Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export default App;
