// source/store/store.ts
import { writable } from 'svelte/store';
import browser from 'webextension-polyfill';
import { Principal } from '@dfinity/principal';

// Define default state for all store sections
export const DEFAULT_STATE = {
  settings: {
    displayHelpMessage: true,
  },
  principal: {
    principalId: '',
  },
};

// Type for the entire store state (explicitly widen literal types)
export type AppState = {
  settings: {
    displayHelpMessage: boolean;
  };
  principal: {
    principalId: string;
  };
};

// Create a single writable store
export const appStore = writable<AppState>(DEFAULT_STATE);

// Storage keys for different data types
const STORAGE_KEYS = {
  settings: 'settings',
  principal: 'ic.computr',
} as const;

// Load all data from storage on initialization
export async function loadStore() {
  try {
    // Fetch settings from sync storage
    const settingsResult = await browser.storage.sync.get({
      [STORAGE_KEYS.settings]: DEFAULT_STATE.settings,
    });
    // Fetch principal from local storage
    const principalResult = await browser.storage.local.get({
      [STORAGE_KEYS.principal]: DEFAULT_STATE.principal,
    });

    let principalData = principalResult[STORAGE_KEYS.principal];
    // Validate principal
    if (principalData.principalId && !isValidPrincipal(principalData.principalId)) {
      principalData = { principalId: '' };
      await browser.storage.local.set({ [STORAGE_KEYS.principal]: principalData });
    }

    // Combine into a single state
    const newState: AppState = {
      settings: settingsResult[STORAGE_KEYS.settings],
      principal: principalData,
    };

    appStore.set(newState);
  } catch (error) {
    console.error('Error loading store:', error);
    appStore.set(DEFAULT_STATE); // Fallback to defaults on error
  }
}

// Generic update function for any section of the store
export async function updateStore<T extends keyof AppState>(
  section: T,
  updates: Partial<AppState[T]>,
): Promise<string | null> {
  let error: string | null = null;

  appStore.update((current) => {
    const updatedSection = { ...current[section], ...updates };

    // Handle specific validation or side effects
    if (section === 'principal') {
      const principalId = (updates as Partial<AppState['principal']>).principalId;
      if (principalId && !isValidPrincipal(principalId)) {
        error = 'Invalid Principal ID';
        return current; // Don't update if invalid
      }
    }

    const newState = { ...current, [section]: updatedSection };

    // Persist to appropriate storage
    const storage = section === 'settings' ? browser.storage.sync : browser.storage.local;
    const key = STORAGE_KEYS[section];
    storage.set({ [key]: updatedSection });

    return newState;
  });

  return error;
}

// Delete principal (specific action for principal section)
export async function deletePrincipal() {
  await updateStore('principal', { principalId: '' });
}

// Validate Principal ID
function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize the store
loadStore();