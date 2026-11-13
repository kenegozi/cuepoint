# Multistage & Stage Viewer Settings Feature Plan

## 1. Overview & Goals

CuePoint currently supports a single Stage Viewer window synchronized in real time with the Controller window via `BroadcastChannel` (with fallback to `localStorage` storage events).

This feature introduces:
1. **Configurable Stage Viewer Settings**:
   - `showChords` (boolean, default: `true`)
   - `showComments` (boolean, default: `true`)
   - `fontSize` (number in px, default: `26`, adjustable)
   - `directionOverride` ('auto' | 'ltr' | 'rtl', default: `'auto'`)
   - Future extensibility (e.g. line height, color themes, high-contrast mode)
2. **Persistent Settings in LocalStorage**:
   - Settings are stored per stage identifier so that preferences persist across page reloads.
3. **Multi-Stage Viewer Architecture (Fixed 3 Stages)**:
   - Three static stages: `stage-1`, `stage-2`, and `stage-3`.
   - Distinct window targets (`CuePointViewer_stage-1`, etc.) so multiple stage windows can remain open simultaneously on the same host machine without overwriting each other.
   - Independent view settings for each stage (e.g., Stage 1: lyrics only + large font on singer monitor; Stage 2: lyrics + chords on guitarist monitor; Stage 3: comments/cues + chords on drummer/MD monitor).
4. **Controller Multi-Stage Launch Controls**:
   - Controller provides intuitive launch buttons or a dropdown menu to launch Stage 1, Stage 2, or Stage 3.
5. **Standalone / Remote Device Behavior**:
   - Devices opening the app without controller mode (or explicitly loaded as viewer without query parameter) implicitly default to `stage-1`.
   - Refreshing on a remote device preserves the settings of that stage.
   - Remote devices can also explicitly load `?mode=viewer&stage=stage-2` or `#viewer:stage-2` if desired.

---

## 2. Architecture & Data Flow

```
                      +-----------------------------+
                      |      Controller Window      |
                      |  (Set & Song Navigation)    |
                      +--------------+--------------+
                                     |
               BroadcastChannel / Storage Events (SYNC_SET, SELECT_SONG)
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
           v                         v                         v
+---------------------+   +---------------------+   +---------------------+
|    Stage 1 Viewer   |   |    Stage 2 Viewer   |   |    Stage 3 Viewer   |
| (window: stage-1)   |   | (window: stage-2)   |   | (window: stage-3)   |
| - showChords: false |   | - showChords: true  |   | - showChords: true  |
| - showComments:false|   | - showComments:false|   | - showComments: true|
| - fontSize: 36px    |   | - fontSize: 24px    |   | - fontSize: 20px    |
| LocalStorage:       |   | LocalStorage:       |   | LocalStorage:       |
| cuepoint_settings_  |   | cuepoint_settings_  |   | cuepoint_settings_  |
| stage-1             |   | stage-2             |   | stage-3             |
+---------------------+   +---------------------+   +---------------------+
```

---

## 3. Data Models & Type Definitions

### 3.1 Stage Identifier
```typescript
export type StageId = 'stage-1' | 'stage-2' | 'stage-3';
export const DEFAULT_STAGE_ID: StageId = 'stage-1';
export const AVAILABLE_STAGES: { id: StageId; label: string; description: string }[] = [
  { id: 'stage-1', label: 'Stage 1', description: 'Primary Stage (Default)' },
  { id: 'stage-2', label: 'Stage 2', description: 'Secondary Stage' },
  { id: 'stage-3', label: 'Stage 3', description: 'Tertiary Stage' },
];
```

### 3.2 Viewer Settings Model
```typescript
export interface StageViewerSettings {
  showChords: boolean;       // Show or hide chords
  showComments: boolean;     // Show or hide {comment: ...} directives
  fontSize: number;          // Root font size in pixels (e.g., 16-60px)
  directionOverride: 'auto' | 'ltr' | 'rtl'; // Text direction override
}

export const DEFAULT_STAGE_VIEWER_SETTINGS: StageViewerSettings = {
  showChords: true,
  showComments: true,
  fontSize: 26,
  directionOverride: 'auto',
};
```

### 3.3 Storage Key Pattern
```typescript
export const getStageSettingsStorageKey = (stageId: StageId): string =>
  `cuepoint_stage_settings_${stageId}`;
```

---

## 4. Detailed Component Changes

### 4.1 URL Parsing & Stage Resolution (`App.tsx`)
1. Detect whether the current tab is in viewer mode:
   - Query param: `?mode=viewer` or `?stage=stage-1` / `?stage=stage-2` / `?stage=stage-3`
   - Hash format support: `#viewer`, `#viewer/stage-1`, etc.
2. Resolve active `stageId`:
   - If query parameter `stage` is provided and is one of `stage-1 | stage-2 | stage-3`, use it.
   - Otherwise, if in viewer mode (or default client device viewer mode), implicitly fallback to `'stage-1'`.
3. Pass `stageId` to `ViewerWindow`:
   ```tsx
   if (isViewerMode) {
     return <ViewerWindow stageId={stageId} currentSong={activeSongParsed} />;
   }
   ```

### 4.2 `SongRenderer.tsx` Updates
1. Add `showComments?: boolean` to `SongRendererProps`:
   ```typescript
   interface SongRendererProps {
     song: SongParsed;
     fontSize: number;
     showChords: boolean;
     showComments?: boolean; // NEW: toggle display of comments
     directionOverride?: 'ltr' | 'rtl' | 'auto';
   }
   ```
2. In the section lines mapping:
   ```tsx
   if (line.comment) {
     if (!showComments) return null; // Respect showComments setting
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
   ```

### 4.3 `ViewerWindow.tsx` Refactoring
1. **Load & Persist Settings**:
   - Initialize settings hook or state using `localStorage.getItem(getStageSettingsStorageKey(stageId))`.
   - Whenever any setting (`showChords`, `showComments`, `fontSize`, `directionOverride`) changes, persist the updated object to `localStorage`.
2. **Header Controls**:
   - Stage Badge: display `STAGE 1`, `STAGE 2`, or `STAGE 3` in the header bar.
   - Chords Toggle: `<button>` toggling chords on/off.
   - Comments Toggle: `<button>` toggling comments on/off (e.g. icon `MessageSquare` or `FileText` with `Comments` label).
   - Font Size: Zoom in/out buttons with numeric indicator.
   - Text Direction: Auto / LTR / RTL toggle buttons.
   - Fullscreen: existing toggle button.
3. **Pass Settings to `SongRenderer`**:
   - Pass `showChords`, `showComments`, `fontSize`, and `directionOverride`.

### 4.4 `ControllerWindow.tsx` UI Updates
1. Replace the single "Open Stage Viewer" button with a multi-stage launcher:
   - **Option A (Split / Grouped Buttons)**:
     - Primary button: "Stage 1"
     - Secondary dropdown or quick links: "Stage 2", "Stage 3"
   - **Option B (Dropdown Menu)**:
     - A button "Open Stage..." with a menu showing:
       - 🖥️ Stage 1 (Main)
       - 🖥️ Stage 2
       - 🖥️ Stage 3
     - Each item opens a new named window:
       ```typescript
       window.open(
         `${window.location.origin}${window.location.pathname}?mode=viewer&stage=${stageId}`,
         `CuePointViewer_${stageId}`,
         'width=1024,height=768'
       );
       ```
     - Naming the window target `CuePointViewer_${stageId}` ensures:
       - Clicking "Stage 1" focuses or opens Stage 1.
       - Clicking "Stage 2" opens a separate Stage 2 window without closing or navigating away from Stage 1.

### 4.5 Standalone / Non-Controller Devices
- When a secondary device (e.g. tablet or phone) navigates to the CuePoint root URL without controller parameters:
  - Defaulting behavior: defaults to `mode=viewer` & `stage=stage-1` if configured as a viewer device, or when opened directly with `?mode=viewer`.
  - When reloaded, `localStorage.getItem('cuepoint_stage_settings_stage-1')` restores its exact settings (font size, chords visibility, comments visibility).

---

## 5. Implementation Steps & Checklist

- [ ] **Step 1: Types & Storage Helpers**
  - Define `StageId`, `StageViewerSettings`, and default constants in `src/types.ts`.
  - Add helper functions `loadStageSettings(stageId: StageId)` and `saveStageSettings(stageId: StageId, settings: StageViewerSettings)`.
- [ ] **Step 2: Update `SongRenderer.tsx`**
  - Add `showComments` prop (default `true`).
  - Conditionally render comment lines based on `showComments`.
- [ ] **Step 3: Update `ViewerWindow.tsx`**
  - Accept `stageId: StageId` (defaulting to `'stage-1'`).
  - Read initial state from localStorage; sync state changes back to localStorage.
  - Add `showComments` toggle button in the header toolbar.
  - Display the current stage badge (`STAGE 1`, `STAGE 2`, `STAGE 3`).
- [ ] **Step 4: Update `ControllerWindow.tsx`**
  - Add Stage selection buttons / dropdown for `Stage 1`, `Stage 2`, `Stage 3`.
  - Call `onOpenViewerWindow(stageId: StageId)` with target stage.
- [ ] **Step 5: Update `App.tsx`**
  - Parse `stage` parameter from query/hash.
  - Implement `handleOpenViewerWindow(stageId: StageId)` launching `CuePointViewer_${stageId}`.
- [ ] **Step 6: Testing & Verification**
  - Verify Stage 1, Stage 2, and Stage 3 can be opened simultaneously.
  - Toggle chords/comments/font size on Stage 1; verify Stage 2 is unaffected.
  - Refresh Stage 1 and Stage 2; verify settings are retained independently.
  - Test song selection synchronization across all open stages.

