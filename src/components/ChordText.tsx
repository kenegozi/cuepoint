import React from 'react';

interface ChordTextProps {
  chord?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a chord symbol, formatting slash chords (e.g. D/A, G/B) so that the bass note
 * (/A, /B) is smaller (0.65 factor) and aligned vertically lower (sub).
 */
export const ChordText: React.FC<ChordTextProps> = ({ chord, className, style }) => {
  if (!chord) {
    return <span className={className} style={style}>{'\u00A0'}</span>;
  }

  const slashIndex = chord.indexOf('/');
  if (slashIndex !== -1 && slashIndex > 0 && slashIndex < chord.length - 1) {
    const mainChord = chord.slice(0, slashIndex);
    const bassPart = chord.slice(slashIndex); // e.g. "/A"

    return (
      <span className={className} style={style}>
        {mainChord}
        <span style={{ fontSize: 'var(--slash-chord-font-size, 0.8em)', verticalAlign: 'sub' }}>
          {bassPart}
        </span>
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {chord}
    </span>
  );
};

