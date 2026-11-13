# CuePoint — RTL (Right-to-Left) Support Requirements

## 1. Overview & Objectives

CuePoint needs first-class support for Right-to-Left (RTL) languages (such as Hebrew and Arabic).

In live band performance scenarios, RTL text introduces distinct UI and musical typesetting challenges:
- **Mixed directionality (Bidirectional text / BiDi):** Hebrew/Arabic lyrics accompanied by Latin chord symbols (e.g., `Am`, `G#m7`, `C/E`), English section directives, numbers, and musical cues.
- **Controller UI orientation:** Full app layout mirroring (navigation, song lists, action buttons, modals, badges).
- **Stage / Viewer layout:** Reading flow for lyrics, section markers, and metadata, while preserving chord-to-lyric alignment.
- **Granular control:** Song-level configuration, allowing sets to contain both LTR songs (e.g., English) and RTL songs (e.g., Hebrew) seamlessly without manual toggling during a gig.

---

## 2. Scope & Use Cases

1. **Multilingual Sets:** A band plays a mixed setlist with Hebrew and English songs. The stage viewer must automatically adapt its rendering direction per song based on song metadata or auto-detection.
2. **Controller Experience:** A Hebrew-speaking bandleader or sound engineer can operate the Controller window in full RTL layout.
3. **Stage Display:** Musicians reading from tablets or stage monitors see lyrics right-aligned and flowing right-to-left, with chords positioned accurately over the corresponding Hebrew/Arabic syllables.

---

## 3. Song Details & Metadata Specification (Stage Viewer)

### 3.1 Metadata & Directive Specification

Song directionality is declared directly inside the song's ChordPro file using the standard ChordPro `meta` directive:

1. **ChordPro Meta Directive:**
   - Syntax:
     ```chordpro
     {meta: direction rtl}
     ```
   - Allowed values:
     - `rtl`: Right-to-Left orientation.
     - `ltr`: Left-to-Right orientation.
     - `auto`: Inferred/auto-detected direction (default/implied if omitted).

2. **Auto-Detection Fallback:**
   - When `{meta: direction ...}` is omitted or set to `auto`, CuePoint inspects the song's title and lyrics:
     - If Hebrew (`[\u0590-\u05FF]`) or Arabic (`[\u0600-\u06FF]`) characters make up the majority of text, default to `rtl`.
     - Otherwise, default to `ltr`.

### 3.2 Stage Viewer UI Controls

- **Manual Override in Viewer Controls:**
  - In addition to font size (`ZoomIn`/`ZoomOut`) and chord display mode (`Lyrics`/`Chords`), provide a toggle in the Viewer toolbar:
    - `LTR` | `RTL` | `Auto` (defaults to the song's configured direction).
  - Changing this allows quick ad-hoc correction during rehearsals if a song file lacks metadata.

---

## 4. Stage / Song Rendering Requirements (RTL View for Stage)

### 4.1 Chords & Lyrics Alignment (Crucial Musical Mechanics)

Rendering chords above RTL lyrics requires careful handling:
- **Lyric Flow:** Hebrew/Arabic lines read right-to-left (`dir="rtl"`, `text-align: right`).
- **Chord Names:** Chord notations (`Am`, `F#m7`, `Bb`, `C/G`) are Latin text, read left-to-right.
- **Placement & Sequence:**
  - A ChordPro line like:
    ```chordpro
    [Am]שלום [Dm]לך [E]ארץ נהדרת
    ```
  - Must render with `[Am]` positioned directly above `שלום`, `[Dm]` above `לך`, and `[E]` above `ארץ`.
  - The segments must flow from right to left across the screen.
  - Chords themselves must **never** be inverted (e.g., `Am` must not become `mA`).

### 4.2 Visual Styling & Sections
- **Section Accents:**
  - Verses, Choruses, and Bridges use border highlights (e.g., `border-r-4` instead of `border-l-4` in RTL) and right-aligned padding (`pr-4` instead of `pl-4`).
- **Section Titles & Badges:**
  - Titles like `[בית 1]` or `[פזמון]` align to the right.
  - Metadata badges (Key, BPM, Time, Capo) stack or flow cleanly from right to left or keep a neat flex-wrap orientation without colliding with headers.
- **Typography:**
  - Use modern, high-legibility Hebrew/Arabic web and system fonts on stage monitors (e.g., `system-ui`, `Heebo`, `Rubik`, `Arial`).

---

## 5. Controller UI Requirements (RTL View for Controller)

### 5.1 Controller Layout Orientation
- The Controller UI layout should be flippable to RTL:
  - **Sidebar / Song List:** Positioned on the right side of the screen in RTL mode (or left in LTR).
  - **Song Details / Live Preview Panel:** Positioned on the left side in RTL mode.
  - **Header & Action Buttons:** Logo/title on the right; Settings, Viewer launch, Folder Picker, and status on the left.
  - **Song List Item Controls:** Play/active indicators, reorder buttons (`ChevronUp`, `ChevronDown`), and filenames align according to standard RTL conventions.

### 5.2 Controller RTL Configuration & Mode
- **Controller Setting:**
  - Add a setting in the Settings Modal / top bar for the Controller interface:
    - `Layout Direction`: `LTR` | `RTL` | `Auto (System Language)`.
  - Stored in browser `localStorage`.
- **Form & Modal Inputs:**
  - Set Title, Song Title, Comments, and file creation modals adjust input text direction dynamically based on input content or controller mode.

---

## 6. Technical Architecture & Implementation Plan

### 6.1 Type System Updates (`src/types/index.ts`)
```typescript
export type TextDirection = 'ltr' | 'rtl' | 'auto';

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
  direction?: 'ltr' | 'rtl'; // resolved direction (parsed from {meta: direction ...} or auto-detected)
  sections: SongSection[];
}

export interface SyncMessage {
  // Existing fields...
  direction?: 'ltr' | 'rtl';
}
```

### 6.2 Parser Enhancements (`src/utils/chordpro.ts`)
- Recognize `{meta: direction <rtl|ltr|auto>}`.
- If direction is `auto` or omitted, run `detectDirection(lyricsAndTitle): 'rtl' | 'ltr'` fallback based on Hebrew/Arabic Unicode ranges.

### 6.3 DOM & CSS Strategy (Tailwind CSS)
- Leverage Tailwind RTL variants or CSS logical properties (`dir="rtl"`, `start-*`, `end-*`, `text-start`, `ms-*`, `me-*`).
- In `SongRenderer.tsx`:
  - Set `dir={songDirection}` on container.
  - For chord-lyric segments:
    ```tsx
    <div className="flex flex-wrap items-end leading-none py-1" dir={direction}>
      {line.items.map((item, idx) => (
        <span key={idx} className="inline-flex flex-col items-start whitespace-pre ms-0.5">
          {showChords && (
            <span dir="ltr" className="font-bold text-amber-400 font-mono h-[1.3em] leading-none select-none">
              {item.chord || '\u00A0'}
            </span>
          )}
          <span className="text-zinc-100 font-medium leading-normal">
            {item.lyric || (item.chord ? '\u00A0\u00A0' : '')}
          </span>
        </span>
      ))}
    </div>
    ```
  - Ensuring the chord maintains `dir="ltr"` avoids unwanted punctuation/symbol shifts (e.g. `Am/F#` or `C#7`).

### 6.4 Sync Protocol (`BroadcastChannel`)
- When a song is activated on the Controller, its calculated or explicit direction is passed across the `BroadcastChannel` in `SyncMessage`, ensuring Viewers switch direction synchronously.

---

## 7. Acceptance Criteria & Test Cases

1. **RTL Song on Stage:**
   - Loading a Hebrew song displays lyrics aligned to the right.
   - Chords sit right over their respective Hebrew words/syllables and flow right-to-left across the line.
   - Chord symbols remain in left-to-right format (e.g., `G#m7` is never reversed).
2. **Mixed Setlist Switching:**
   - Selecting an English song switches Viewer to LTR.
   - Selecting a Hebrew song immediately switches Viewer to RTL.
3. **Controller UI Mirroring:**
   - Switching the Controller to RTL flips the sidebar, navigation, lists, and modal drawers cleanly with no broken flex/grid layouts.
4. **Offline & Persistence:**
   - ChordPro files containing `{meta: direction rtl}` parse correctly in both online and offline cached states.

