import React, { useState, useEffect, useMemo } from 'react';
import { parseChordPro } from '../utils/chordpro';
import { X, Save, Eye, Edit3, AlertCircle } from 'lucide-react';

interface SongEditorModalProps {
  isOpen: boolean;
  fileName: string;
  initialContent: string;
  onClose: () => void;
  onSave: (fileName: string, content: string) => Promise<void>;
}

export const SongEditorModal: React.FC<SongEditorModalProps> = ({
  isOpen,
  fileName,
  initialContent,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Reset content when opening or when initialContent changes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setError(null);
    }
  }, [isOpen, initialContent]);

  // Parse preview on content change
  const songId = fileName.replace(/\.chordpro$/, '');
  const parsedPreview = useMemo(() => {
    try {
      return parseChordPro(content, songId);
    } catch {
      return null;
    }
  }, [content, songId]);

  const editorDirection: 'ltr' | 'rtl' = parsedPreview?.direction || 'ltr';

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(fileName, content);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save song file');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <header className="bg-zinc-950 border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Edit Song File</h3>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                  {fileName}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    editorDirection === 'rtl'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  DIR: {editorDirection.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Changes will be saved to Google Drive (if connected) and local cache, and updated on stage viewers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border ${
                showPreview
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save File'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
              title="Close without saving"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-950/70 border-b border-rose-800 text-rose-200 px-6 py-2.5 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Body: Editor & Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className={`flex-1 flex flex-col p-4 ${showPreview ? 'border-r border-zinc-800' : ''}`}>
            <div className="flex items-center justify-between pb-2 text-xs font-mono text-zinc-400">
              <span>ChordPro Editor</span>
              <span className="text-zinc-500">
                Direction follows <code className="text-amber-400">{'{meta: direction rtl}'}</code> or auto-detected language
              </span>
            </div>
            <textarea
              dir={editorDirection}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="{title: Song Title}&#10;{artist: Artist}&#10;&#10;[Am]Lyrics here..."
              className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 resize-none leading-relaxed select-text"
              spellCheck={false}
            />
          </div>

          {/* Quick Preview Panel */}
          {showPreview && (
            <div className="w-1/2 flex flex-col p-4 bg-zinc-950/40 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-mono text-zinc-400">
                <span>Live Parsed Preview</span>
                {parsedPreview && (
                  <span className="text-zinc-500">{parsedPreview.sections.length} sections</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                {parsedPreview ? (
                  <div dir={parsedPreview.direction || 'ltr'} className={parsedPreview.direction === 'rtl' ? 'text-right' : 'text-left'}>
                    <div className="mb-4 pb-2 border-b border-zinc-800">
                      <h4 className="text-lg font-bold text-white">{parsedPreview.title}</h4>
                      {parsedPreview.artist && (
                        <p className="text-xs text-amber-400">{parsedPreview.artist}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono text-zinc-400">
                        {parsedPreview.key && <span className="bg-zinc-800 px-2 py-0.5 rounded">KEY: {parsedPreview.key}</span>}
                        {parsedPreview.tempo && <span className="bg-zinc-800 px-2 py-0.5 rounded">BPM: {parsedPreview.tempo}</span>}
                        {parsedPreview.capo && <span className="bg-zinc-800 px-2 py-0.5 rounded text-amber-400">CAPO: {parsedPreview.capo}</span>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {parsedPreview.sections.map((section, sIdx) => (
                        <div
                          key={sIdx}
                          className={`${
                            section.type === 'chorus'
                              ? parsedPreview.direction === 'rtl'
                                ? 'border-r-2 border-amber-500 pr-3 my-3'
                                : 'border-l-2 border-amber-500 pl-3 my-3'
                              : 'my-3'
                          }`}
                        >
                          {section.title && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500/80 block mb-1">
                              [{section.title}]
                            </span>
                          )}
                          <div className="space-y-2">
                            {section.lines.map((line, lIdx) => (
                              <div key={lIdx} className="leading-snug">
                                {line.comment && (
                                  <div className="text-xs italic text-zinc-500 mb-1">
                                    # {line.comment}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-end">
                                  {line.items.map((item, iIdx) => (
                                    <span key={iIdx} className="inline-flex flex-col mx-0.5">
                                      <span className="text-[11px] font-mono font-bold text-amber-400 leading-none h-4">
                                        {item.chord || '\u00A0'}
                                      </span>
                                      <span className="text-sm font-sans text-zinc-200 whitespace-pre leading-normal">
                                        {item.lyric || (item.chord ? '\u00A0' : '')}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Preview not available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

