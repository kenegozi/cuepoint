# CuePoint

This is an app for band, used to display lyrics and chords on stage. 

## Features

- Main featues is being able to Display lyrics and chords for songs.
- Songs are groups into a Set. A set is stored in a Google Drive folder.
- Right now we will just support a single set at a time. 
- when opening the app, the user selects the folder containing the set.
- There would be a "Controller" window, and one or more "Viewer" windows
- Controller window 
  - Has a list of songs in the set
  - For each song clicked it shows the song's metadata. It also syncs all Viewer windows to choose that song.
- Viewer Window
  - displays song with lyrics and chords
  - has small section with controls for font size.
  - Can render the songs with lyrics only, or with chords as well.
  - Need to figure a way to sync the controller and viewer windows when the hosting is just static HTML file without relying on realtime communication through a server
  - When viewing a song, headers, section titles, etc should have size relative to the main lyrics font size, and the chords should also have relative size. The font sizes shuold be configurable in the UI

- Storage
  - A set is stored in a Google Drive folder
  - Each song in the set is stored as a ChordPro file in that folder.
  - A main file SETNAME.cuepoint.json should also be stored in that folder, which contains metadata about the set, such as title, description, etc. It also contains the order of the songs in the set.
- the app should utilize Google Drive API to read the song lyrics from a shared Drive. It should store, or cache, the files in local storage so that it continues to work when offline.

---

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Google Identity Services & OAuth Setup
To connect with Google Drive and the Google Folder Picker:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable **Google Drive API** and **Google Picker API**.
3. Create an **OAuth 2.0 Client ID (Web Application)** and add your origins (e.g. `http://localhost:5173`).
4. Create an **API Key** restricted to Google Picker API.
5. In the CuePoint app, click the **Settings** icon in the top bar to enter your Client ID and API Key, which are safely saved in your browser's local storage.

