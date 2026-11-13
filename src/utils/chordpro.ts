import { SongParsed, SongSection, SongLine, ChordLyricPair, TextDirection } from '../types';

/**
 * Detects whether the given text is primarily Right-to-Left (e.g. Hebrew or Arabic)
 * by comparing counts of RTL script characters vs Latin script characters.
 */
export function detectDirection(text: string): 'ltr' | 'rtl' {
  const rtlChars = text.match(/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const ltrChars = text.match(/[A-Za-z]/g);

  const rtlCount = rtlChars ? rtlChars.length : 0;
  const ltrCount = ltrChars ? ltrChars.length : 0;

  return rtlCount > ltrCount ? 'rtl' : 'ltr';
}

export function parseChordPro(rawText: string, id: string): SongParsed {
  const lines = rawText.split(/\r?\n/);
  let explicitDirection: TextDirection | undefined;
  
  const parsed: SongParsed = {
    id,
    title: id,
    rawText,
    sections: [],
  };

  let currentSection: SongSection = {
    type: 'other',
    lines: [],
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Check for directive: {directive: value} or {directive}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z0-9_-]+)(?::\s*(.*))?\}$/);
    if (directiveMatch) {
      const name = directiveMatch[1].toLowerCase();
      const val = directiveMatch[2] ? directiveMatch[2].trim() : '';

      switch (name) {
        case 'title':
        case 't':
          parsed.title = val;
          break;
        case 'meta': {
          // Standard ChordPro {meta: key value} e.g. {meta: direction rtl}
          const metaMatch = val.match(/^([a-zA-Z0-9_-]+)\s+(.+)$/);
          if (metaMatch) {
            const metaKey = metaMatch[1].toLowerCase();
            const metaVal = metaMatch[2].trim().toLowerCase();
            if (metaKey === 'direction') {
              if (metaVal === 'rtl' || metaVal === 'ltr' || metaVal === 'auto') {
                explicitDirection = metaVal;
              }
            }
          }
          break;
        }
        case 'artist':
        case 'a':
          parsed.artist = val;
          break;
        case 'key':
          parsed.key = val;
          break;
        case 'tempo':
        case 'bpm':
          parsed.tempo = val;
          break;
        case 'capo':
          parsed.capo = val;
          break;
        case 'time':
          parsed.time = val;
          break;
        case 'comment':
        case 'c':
        case 'ci':
          if (val) {
            currentSection.lines.push({ items: [], comment: val });
          }
          break;
        case 'start_of_chorus':
        case 'soc':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'chorus', title: 'Chorus', lines: [] };
          break;
        case 'end_of_chorus':
        case 'eoc':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'other', lines: [] };
          break;
        case 'start_of_verse':
        case 'sov':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'verse', title: 'Verse', lines: [] };
          break;
        case 'end_of_verse':
        case 'eov':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'other', lines: [] };
          break;
        case 'start_of_bridge':
        case 'sob':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'bridge', title: 'Bridge', lines: [] };
          break;
        case 'end_of_bridge':
        case 'eob':
          if (currentSection.lines.length > 0) {
            parsed.sections.push(currentSection);
          }
          currentSection = { type: 'other', lines: [] };
          break;
      }
      continue;
    }

    // Empty line separates implied sections or stanza breaks
    if (trimmed === '') {
      if (currentSection.lines.length > 0) {
        parsed.sections.push(currentSection);
        currentSection = { type: 'other', lines: [] };
      }
      continue;
    }

    // Parse ChordPro line into [chord]lyric chunks
    const parsedLine = parseLine(rawLine);
    currentSection.lines.push(parsedLine);
  }

  if (currentSection.lines.length > 0) {
    parsed.sections.push(currentSection);
  }

  // Resolve direction:
  // If explicit rtl or ltr, use it.
  // If auto or omitted, auto-detect from title and lyrics.
  if (explicitDirection === 'rtl' || explicitDirection === 'ltr') {
    parsed.direction = explicitDirection;
  } else {
    // Collect all lyric text and title
    let allText = parsed.title || '';
    for (const section of parsed.sections) {
      if (section.title) allText += ' ' + section.title;
      for (const line of section.lines) {
        if (line.comment) allText += ' ' + line.comment;
        for (const item of line.items) {
          if (item.lyric) allText += ' ' + item.lyric;
        }
      }
    }
    parsed.direction = detectDirection(allText);
  }

  return parsed;
}

function parseLine(line: string): SongLine {
  const items: ChordLyricPair[] = [];
  const regex = /\[([^\]]*)\]([^\[]*)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  // Check if line starts with text before the first chord
  const firstChordIdx = line.indexOf('[');
  if (firstChordIdx > 0) {
    items.push({
      chord: '',
      lyric: line.substring(0, firstChordIdx),
    });
    regex.lastIndex = firstChordIdx;
  } else if (firstChordIdx === -1) {
    // Pure lyric line with no chords
    return {
      items: [{ chord: '', lyric: line }],
    };
  }

  while ((match = regex.exec(line)) !== null) {
    items.push({
      chord: match[1] || '',
      lyric: match[2] || '',
    });
    lastIndex = regex.lastIndex;
  }

  // Any leftover text
  if (lastIndex < line.length) {
    items.push({
      chord: '',
      lyric: line.substring(lastIndex),
    });
  }

  return { items };
}

