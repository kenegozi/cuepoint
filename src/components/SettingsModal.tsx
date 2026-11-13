import React, { useState } from 'react';
import { getGoogleConfig, saveGoogleConfig } from '../services/googleDriveService';
import { TextDirection } from '../types';
import { X, Check, Key, Layout } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controllerDirection: TextDirection;
  onControllerDirectionChange: (dir: TextDirection) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  controllerDirection,
  onControllerDirectionChange,
}) => {
  const currentConfig = getGoogleConfig();
  const [clientId, setClientId] = useState(currentConfig.clientId);
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [selectedDirection, setSelectedDirection] = useState<TextDirection>(controllerDirection);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleConfig({ clientId: clientId.trim(), apiKey: apiKey.trim() });
    onControllerDirectionChange(selectedDirection);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Application Settings</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Controller Layout Direction */}
          <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-white">
                Controller UI Layout Direction
              </label>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2.5">
              Sets whether the Controller interface (setlist, navigation, tools) renders in LTR or RTL mode.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDirection('ltr')}
                className={`py-1.5 px-3 rounded text-xs font-semibold border transition ${
                  selectedDirection === 'ltr'
                    ? 'bg-amber-500 text-black border-amber-500 font-bold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                LTR (Left to Right)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirection('rtl')}
                className={`py-1.5 px-3 rounded text-xs font-semibold border transition ${
                  selectedDirection === 'rtl'
                    ? 'bg-amber-500 text-black border-amber-500 font-bold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                RTL (Right to Left)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirection('auto')}
                className={`py-1.5 px-3 rounded text-xs font-semibold border transition ${
                  selectedDirection === 'auto'
                    ? 'bg-amber-500 text-black border-amber-500 font-bold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                Auto (Browser)
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <label className="text-xs font-mono text-zinc-300 block mb-1">
              Google OAuth 2.0 Web Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 123456789-xxxxxx.apps.googleusercontent.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">
              Google API Key (for Google Picker)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. AIzaSy..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="bg-zinc-950/60 p-3 rounded border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">Quick Setup Instructions:</p>
            <p>1. In Google Cloud Console, enable <strong>Google Drive API</strong> &amp; <strong>Google Picker API</strong>.</p>
            <p>2. Create OAuth Client ID (Web Application) with origin <code>{window.location.origin}</code>.</p>
            <p>3. Create an API Key restricted to Google Picker API.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded flex items-center gap-1.5 transition"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

