import { writable } from 'svelte/store';
import browser from 'webextension-polyfill';

// Default settings
export const DEFAULT_SETTINGS = {
  displayHelpMessage: true
};

// Create a writable store with default settings
export const settingsStore = writable(DEFAULT_SETTINGS);

// Load settings from storage with a default value
export async function loadSettings() {
  try {
    const result = await browser.storage.sync.get({ settings: DEFAULT_SETTINGS });
    settingsStore.set(result.settings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Update settings in storage and update the store
export async function updateSettings(newSettings: Partial<typeof DEFAULT_SETTINGS>) {
  settingsStore.update((current) => {
    const updated = { ...current, ...newSettings };
    browser.storage.sync.set({ settings: updated });
    return updated;
  });
}
