import React, { useState, useEffect, useCallback } from 'react';
import { SetData, SetSong, SongParsed, SyncMessage } from './types';
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
    return window.location.search.includes('mode=viewer') || window.location.hash === '#viewer';
  });

  const [activeSet, setActiveSet] = useState<SetData>(DEMO_SET);
  const [activeSongIndex, setActiveSongIndex] = useState<number>(0);
  const [activeSongParsed, setActiveSongParsed] = useState<SongParsed | null>(null);

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

  // Pre-seed demo songs into cache if empty
  useEffect(() => {
    async function seedDemo() {
      const cached = await storageService.getSet(DEMO_SET.id);
      if (!cached) {
        await storageService.saveSet(DEMO_SET);
        for (const [fn, content] of Object.entries(DEMO_SONGS)) {
          await storageService.saveSongFile(fn, content);
        }
      }
    }
    seedDemo();
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
    const unsubscribe = syncService.subscribe((msg: SyncMessage) => {
      if (msg.type === 'SELECT_SONG' && typeof msg.songIndex === 'number') {
        loadSongAtIndex(msg.songIndex);
      }
    });
    return unsubscribe;
  }, [loadSongAtIndex]);

  // Handle song selection by Controller
  const handleSelectSong = (index: number) => {
    loadSongAtIndex(index);
    syncService.broadcast({
      type: 'SELECT_SONG',
      songIndex: index,
      songId: activeSet.songs[index]?.fileName,
    });
  };

  // Open Stage Viewer in a separate clean window
  const handleOpenViewerWindow = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=viewer`;
    window.open(url, 'CuePointViewer', 'width=1024,height=768');
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
            setActiveSet(parsedSet);
            setStatusMessage(`Loaded set "${parsedSet.title}" from Google Drive.`);
            loadSongAtIndex(0, parsedSet);
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
      setActiveSet(newSet);
      setActiveSongIndex(-1);
      setActiveSongParsed(null);
      setShowNewSetModal(false);
      setStatusMessage(`Created new set "${newSet.title}".`);
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setErrorMessage(`Failed to create set file: ${err.message}`);
    }
  };

  // If this window is dedicated to the stage display
  if (isViewerMode) {
    return <ViewerWindow currentSong={activeSongParsed} />;
  }

  // Otherwise Controller Window
  return (
    <>
      <ControllerWindow
        set={activeSet}
        activeSongIndex={activeSongIndex}
        activeSongParsed={activeSongParsed}
        onSelectSong={handleSelectSong}
        onReorderSongs={handleReorderSongs}
        onAddSong={handleAddSong}
        onSaveSet={handleSaveSet}
        onOpenFolderPicker={handleOpenFolderPicker}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenViewerWindow={handleOpenViewerWindow}
        isSaving={isSaving}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

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
