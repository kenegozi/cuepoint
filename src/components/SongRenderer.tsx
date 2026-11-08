import React from 'react';
import { SongParsed } from '../types';

interface SongRendererProps {
  song: SongParsed;
  fontSize: number; // in pixels
  showChords: boolean;
}

export const SongRenderer: React.FC<SongRendererProps> = ({ song, fontSize, showChords }) => {
  return (
    <div
      className="w-full max-w-5xl mx-auto px-4 py-8 select-text"
      style={{
        // Define root font size and calculated relatives
        ['--lyrics-font-size' as any]: `${fontSize}px`,
        fontSize: 'var(--lyrics-font-size)',
        lineHeight: 1.5,
      }}
    >
      {/* Song Header */}
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <h1
          className="font-black tracking-tight text-white uppercase leading-none"
          style={{ fontSize: 'calc(var(--lyrics-font-size) * 1.5)' }}
        >
          {song.title}
        </h1>
        {song.artist && (
          <p
            className="text-amber-400 font-semibold mt-1"
            style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.9)' }}
          >
            {song.artist}
          </p>
        )}

        {/* Metadata badges: Key, Tempo, Time, Capo */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-zinc-400 font-mono">
          {song.key && (
            <span
              className="bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded border border-zinc-700 font-bold"
              style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.65)' }}
            >
              KEY: {song.key}
            </span>
          )}
          {song.tempo && (
            <span
              className="bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded border border-zinc-700 font-bold"
              style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.65)' }}
            >
              BPM: {song.tempo}
            </span>
          )}
          {song.time && (
            <span
              className="bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded border border-zinc-700 font-bold"
              style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.65)' }}
            >
              TIME: {song.time}
            </span>
          )}
          {song.capo && (
            <span
              className="bg-amber-950/60 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded font-bold"
              style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.65)' }}
            >
              CAPO: {song.capo}
            </span>
          )}
        </div>
      </header>

      {/* Song Sections */}
      <div className="space-y-6">
        {song.sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className={`rounded-lg transition-all ${
              section.type === 'chorus'
                ? 'bg-zinc-900/40 border-l-4 border-amber-500 pl-4 py-2 my-4'
                : section.type === 'bridge'
                ? 'border-l-4 border-sky-500 pl-4 py-2 my-4'
                : ''
            }`}
          >
            {section.title && (
              <div
                className="font-bold uppercase tracking-wider text-zinc-400 mb-2 font-mono"
                style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.75)' }}
              >
                [{section.title}]
              </div>
            )}

            <div className="space-y-2">
              {section.lines.map((line, lIdx) => {
                if (line.comment) {
                  return (
                    <div
                      key={lIdx}
                      className="italic text-zinc-500 font-mono py-1"
                      style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.8)' }}
                    >
                      {line.comment}
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="flex flex-wrap items-end leading-none py-1">
                    {line.items.map((item, iIdx) => (
                      <span key={iIdx} className="inline-flex flex-col items-start whitespace-pre mr-0.5">
                        {showChords && (
                          <span
                            className="font-bold text-amber-400 font-mono h-[1.3em] leading-none select-none"
                            style={{ fontSize: 'calc(var(--lyrics-font-size) * 0.85)' }}
                          >
                            {item.chord || '\u00A0'}
                          </span>
                        )}
                        <span className="text-zinc-100 font-medium leading-normal">
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
  );
};

