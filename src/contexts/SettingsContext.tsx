import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  loadSettings,
  saveSettings,
  type PantrySettings,
} from '@/lib/settings';

interface SettingsContextValue {
  settings: PantrySettings;
  updateSettings: (patch: Partial<PantrySettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PantrySettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<PantrySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // The static index.html shell is shared across all tenants and defaults to
  // "Cupboard" — each tenant's tab title is set here once its own settings load.
  useEffect(() => {
    document.title = settings.pantryName;
  }, [settings.pantryName]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
