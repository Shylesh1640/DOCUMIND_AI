'use client';

import { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Database, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: ApiSettings) => void;
  initialSettings: ApiSettings;
}

export interface ApiSettings {
  groqApiKey: string;
  openrouterApiKey: string;
  chromaUrl: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: SettingsModalProps) {
  const [groqKey, setGroqKey] = useState(initialSettings.groqApiKey || '');
  const [openrouterKey, setOpenrouterKey] = useState(initialSettings.openrouterApiKey || '');
  const [chromaUrl, setChromaUrl] = useState(initialSettings.chromaUrl || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGroqKey(initialSettings.groqApiKey || '');
    setOpenrouterKey(initialSettings.openrouterApiKey || '');
    setChromaUrl(initialSettings.chromaUrl || '');
  }, [initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      groqApiKey: groqKey.trim(),
      openrouterApiKey: openrouterKey.trim(),
      chromaUrl: chromaUrl.trim(),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-navy-600/20 border border-navy-500/30 rounded-lg text-navy-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">API Keys & Connection Settings</h2>
              <p className="text-xs text-dark-400">Keys are stored locally in your browser only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Privacy note */}
          <div className="flex items-start gap-2.5 bg-navy-950/60 border border-navy-800/60 rounded-xl p-3 text-xs text-dark-300">
            <ShieldCheck className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
            <span>
              Your API keys remain on your device in <code className="text-navy-300">localStorage</code> and are passed per request securely to invoke your chosen AI models.
            </span>
          </div>

          {/* Groq API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-dark-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Groq API Key (Recommended — Fast & Free)
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-navy-400 hover:text-navy-300 inline-flex items-center gap-1 transition-colors"
              >
                Get free key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="input-field text-xs font-mono"
            />
            <p className="text-[10px] text-dark-500 mt-1">
              Used for Llama 3.3 70B, Llama 3.1 8B, and Mixtral models on Groq.
            </p>
          </div>

          {/* OpenRouter API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-dark-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                OpenRouter API Key (Optional)
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-navy-400 hover:text-navy-300 inline-flex items-center gap-1 transition-colors"
              >
                Get key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-or-..."
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="input-field text-xs font-mono"
            />
            <p className="text-[10px] text-dark-500 mt-1">
              Enables Claude 3.5 Haiku, GPT-4o Mini, and free OpenRouter models.
            </p>
          </div>

          {/* ChromaDB URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-dark-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                ChromaDB URL (Vector Database)
              </label>
            </div>
            <input
              type="text"
              placeholder="http://localhost:8000 or Railway URL"
              value={chromaUrl}
              onChange={(e) => setChromaUrl(e.target.value)}
              className="input-field text-xs font-mono"
            />
            <p className="text-[10px] text-dark-500 mt-1">
              Leave blank to use the server default endpoint.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-800 bg-dark-950/40">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
