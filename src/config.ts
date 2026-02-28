import { Configuration } from './types.js';

const STORAGE_KEY = 'ha_widget_config';

export function loadConfig(): Configuration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Configuration;
  } catch {
    return {};
  }
}

export function saveConfig(cfg: Configuration): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
