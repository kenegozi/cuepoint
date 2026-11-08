export interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
}

const SETTINGS_KEY = 'cuepoint_google_credentials';

export function getGoogleConfig(): GoogleAuthConfig {
  const local = localStorage.getItem(SETTINGS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  return {
    clientId: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '',
    apiKey: (import.meta as any).env?.VITE_GOOGLE_API_KEY || '',
  };
}

export function saveGoogleConfig(config: GoogleAuthConfig) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
}

class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async requestAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = getGoogleConfig();
    if (!config.clientId) {
      throw new Error('Google Client ID is missing. Please configure it in Settings.');
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        return reject(new Error('Google Identity Services script not loaded. Check connection.'));
      }

      // @ts-ignore
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
        callback: (resp: any) => {
          if (resp.error) {
            return reject(resp);
          }
          this.accessToken = resp.access_token;
          this.tokenExpiry = Date.now() + (resp.expires_in || 3500) * 1000;
          resolve(resp.access_token);
        },
      });

      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  async listFolderFiles(folderId: string): Promise<Array<{ id: string; name: string }>> {
    const token = await this.requestAccessToken();
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to list folder files: ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  }

  async getFileContent(fileId: string): Promise<string> {
    const token = await this.requestAccessToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch file content: ${res.statusText}`);
    }
    return await res.text();
  }

  async saveFileToFolder(folderId: string, fileName: string, content: string, mimeType = 'text/plain'): Promise<{ id: string }> {
    const token = await this.requestAccessToken();
    
    // Check if file already exists in folder
    const files = await this.listFolderFiles(folderId);
    const existing = files.find(f => f.name === fileName);

    if (existing) {
      // Update existing file
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': mimeType,
        },
        body: content,
      });
      if (!res.ok) {
        throw new Error(`Failed to update file: ${res.statusText}`);
      }
      return { id: existing.id };
    } else {
      // Create multipart upload
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType,
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content +
        closeDelim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!res.ok) {
        throw new Error(`Failed to create file: ${res.statusText}`);
      }
      const data = await res.json();
      return { id: data.id };
    }
  }

  openFolderPicker(onPick: (folder: { id: string; name: string }) => void, onError: (err: any) => void) {
    const config = getGoogleConfig();
    this.requestAccessToken()
      .then((token) => {
        // @ts-ignore
        if (typeof gapi === 'undefined' || !gapi.load) {
          throw new Error('Google API client (gapi) not loaded yet.');
        }

        // @ts-ignore
        gapi.load('picker', () => {
          // @ts-ignore
          const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setMimeTypes('application/vnd.google-apps.folder')
            .setSelectFolderEnabled(true);

          // @ts-ignore
          const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(token)
            .setDeveloperKey(config.apiKey)
            .setCallback((data: any) => {
              // @ts-ignore
              if (data.action === google.picker.Action.PICKED) {
                const doc = data.docs[0];
                onPick({ id: doc.id, name: doc.name });
              }
            })
            .build();
          picker.setVisible(true);
        });
      })
      .catch(onError);
  }
}

export const googleDriveService = new GoogleDriveService();

