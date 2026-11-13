import React, { useRef, useState } from 'react';
import { SongParsed } from '../types';
import { ChordText } from './ChordText';
import { Printer, X, ZoomIn, ZoomOut, Music, AlignLeft, MessageSquare } from 'lucide-react';

interface SongPdfRendererProps {
  song: SongParsed;
  isOpen: boolean;
  onClose: () => void;
}

export const SongPdfRenderer: React.FC<SongPdfRendererProps> = ({
  song,
  isOpen,
  onClose,
}) => {
  const [fontSize, setFontSize] = useState<number>(14);
  const [chordScale, setChordScale] = useState<number>(0.85);
  const [slashChordScale, setSlashChordScale] = useState<number>(0.8);
  const [showChords, setShowChords] = useState<boolean>(true);
  const [showComments, setShowComments] = useState<boolean>(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isRTL = song.direction === 'rtl';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-sm print:bg-white print:p-0">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="print:hidden bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="font-bold text-amber-500 text-sm uppercase tracking-wider">PDF Print Preview</span>
          <span className="text-zinc-600">|</span>
          <span className="text-xs text-zinc-300 font-medium truncate max-w-xs">{song.title}</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-700">
            2 Columns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Chords / Lyrics Toggle */}
          <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setShowChords(false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${!showChords ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              title="Lyrics only"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Lyrics</span>
            </button>
            <button
              onClick={() => setShowChords(true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${showChords ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              title="Lyrics and Chords"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Chords</span>
            </button>
          </div>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${showComments
                ? 'bg-amber-500 text-black border-amber-500 font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            title="Toggle comments/cues"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Cues</span>
          </button>

          {/* Font Size Zoom Control */}
          <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800" title="Font size">
            <button
              onClick={() => setFontSize((f) => Math.max(9, f - 1))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Decrease font size"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-zinc-300 w-8 text-center">{fontSize}pt</span>
            <button
              onClick={() => setFontSize((f) => Math.min(24, f + 1))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Increase font size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Chord Scale Size Control (visible when showChords is enabled) */}
          {showChords && (
            <>
              <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800" title="Chord font size ratio">
                <span className="text-[10px] font-bold text-amber-400 px-1 uppercase">Chd</span>
                <button
                  onClick={() => setChordScale((scale) => Math.max(0.5, Math.round((scale - 0.05) * 100) / 100))}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Decrease chord size"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1 text-amber-400 w-10 text-center">
                  {Math.round(chordScale * 100)}%
                </span>
                <button
                  onClick={() => setChordScale((scale) => Math.min(1.5, Math.round((scale + 0.05) * 100) / 100))}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Increase chord size"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-800" title="Slash chord bass ratio">
                <span className="text-[10px] font-bold text-amber-300 px-1 uppercase">/Bass</span>
                <button
                  onClick={() => setSlashChordScale((scale) => Math.max(0.4, Math.round((scale - 0.05) * 100) / 100))}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Decrease slash bass size"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1 text-amber-300 w-10 text-center">
                  {Math.round(slashChordScale * 100)}%
                </span>
                <button
                  onClick={() => setSlashChordScale((scale) => Math.min(1.2, Math.round((scale + 0.05) * 100) / 100))}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Increase slash bass size"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Sheet Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible">
        {/* Printable Paper Page (A4/Letter-like aspect) */}
        <div
          ref={printAreaRef}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="cuepoint-printable-sheet bg-white text-zinc-900 w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-2xl rounded-sm print:shadow-none print:m-0 print:w-full print:max-w-none print:p-6 print:rounded-none"
          style={{
            ['--lyrics-font-size' as any]: `${fontSize}pt`,
            ['--chord-font-size' as any]: `calc(var(--lyrics-font-size) * ${chordScale})`,
            ['--slash-chord-font-size' as any]: `calc(var(--chord-font-size) * ${slashChordScale})`,
            fontSize: 'var(--lyrics-font-size)',
            lineHeight: 1.35,
          }}
        >
          {/* Header */}
          <header className="border-b-2 border-zinc-900 pb-3 mb-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h1
                  className="font-black tracking-tight text-black uppercase leading-none"
                  style={{ fontSize: 'calc(var(--lyrics-font-size) * 1.6)' }}
                >
                  {song.title}
                </h1>
                {song.artist && (
                  <p
                    className="font-bold text-zinc-700 mt-1"
                    style={{ fontSize: 'calc(var(--lyrics-font-size) * 1.05)' }}
                  >
                    {song.artist}
                  </p>
                )}
              </div>

              {/* Badges: Key, Tempo, Time, Capo */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-800 font-bold">
                {song.key && (
                  <span className="border border-zinc-400 px-2 py-0.5 rounded">KEY: {song.key}</span>
                )}
                {song.tempo && (
                  <span className="border border-zinc-400 px-2 py-0.5 rounded">{song.tempo} BPM</span>
                )}
                {song.time && (
                  <span className="border border-zinc-400 px-2 py-0.5 rounded">{song.time}</span>
                )}
                {song.capo && (
                  <span className="border border-zinc-900 bg-zinc-100 px-2 py-0.5 rounded font-black">
                    CAPO: {song.capo}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Two-Column Layout */}
          <div
            className="print-two-columns"
            style={{
              columnCount: 2,
              columnGap: '2rem',
              columnRule: '1px solid #e4e4e7',
            }}
          >
            {song.sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className={`mb-4 break-inside-avoid ${section.type === 'chorus'
                    ? isRTL
                      ? 'border-r-2 border-zinc-900 pr-2'
                      : 'border-l-2 border-zinc-900 pl-2'
                    : section.type === 'bridge'
                      ? isRTL
                        ? 'border-r-2 border-zinc-500 pr-2'
                        : 'border-l-2 border-zinc-500 pl-2'
                      : ''
                  }`}
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                {section.title && (
                  <div
                    className="font-black uppercase tracking-wider text-zinc-700 mb-1 font-mono"
                    style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.75)' }}
                  >
                    [{section.title}]
                  </div>
                )}

                <div className="space-y-1">
                  {section.lines.map((line, lIdx) => {
                    if (line.comment) {
                      if (!showComments) return null;
                      return (
                        <div
                          key={lIdx}
                          className="italic text-zinc-500 font-mono py-0.5"
                          style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.8)' }}
                        >
                          {line.comment}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={lIdx}
                        className="flex flex-wrap items-end leading-none py-0.5"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        {line.items.map((item, iIdx) => (
                          <span
                            key={iIdx}
                            className={`inline-flex flex-col ${isRTL ? 'items-start ml-0.5' : 'items-start mr-0.5'
                              } whitespace-pre`}
                          >
                            {showChords && (
                              <span
                                dir="ltr"
                                className="font-black text-black font-mono h-[1.25em] leading-none select-none text-left"
                                style={{ fontSize: 'var(--chord-font-size)' }}
                              >
                                <ChordText chord={item.chord} />
                              </span>
                            )}
                            <span className="text-zinc-950 font-medium leading-normal">
                              {item.lyric || (item.chord ? '\u00A0\u00A0' : '')}
                            </span>
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};