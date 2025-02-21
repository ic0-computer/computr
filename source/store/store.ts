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
  approvedDomains: [] as string[],
};

// Type for the entire store state
export type AppState = {
  settings: {
    displayHelpMessage: boolean;
  };
  principal: {
    principalId: string;
  };
  approvedDomains: string[];
};

// Create a single writable store
export const appStore = writable<AppState>(DEFAULT_STATE);

// Storage keys for different data types
const STORAGE_KEYS = {
  settings: 'ic.computr.settings',
  principal: 'ic.computr.principal',
  approvedDomains: 'ic.computr.approvedDomains',
} as const;

// Load all data from storage on initialization
export async function loadStore() {
  try {
    // Fetch all data from local storage
    const localResult = await browser.storage.local.get({
      [STORAGE_KEYS.settings]: DEFAULT_STATE.settings,
      [STORAGE_KEYS.principal]: DEFAULT_STATE.principal,
      [STORAGE_KEYS.approvedDomains]: DEFAULT_STATE.approvedDomains,
    });

    let principalData = localResult[STORAGE_KEYS.principal];
    // Validate principal
    if (principalData.principalId && !isValidPrincipal(principalData.principalId)) {
      principalData = { principalId: '' };
      await browser.storage.local.set({ [STORAGE_KEYS.principal]: principalData });
    }

    // Combine into a single state
    const newState: AppState = {
      settings: localResult[STORAGE_KEYS.settings],
      principal: principalData,
      approvedDomains: localResult[STORAGE_KEYS.approvedDomains] || [],
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

    // Persist to local storage (all sections use local now)
    const key = STORAGE_KEYS[section];
    browser.storage.local.set({ [key]: updatedSection });

    return newState;
  });

  return error;
}

// Delete principal (specific action for principal section)
export async function deletePrincipal() {
  await updateStore('principal', { principalId: '' });
}

// Add an approved domain
export async function addApprovedDomain(domain: string) {
  appStore.update((current) => {
    if (current.approvedDomains.includes(domain)) {
      return current; // No change if already approved
    }
    const updatedDomains = [...current.approvedDomains, domain];
    const newState = { ...current, approvedDomains: updatedDomains };
    browser.storage.local.set({ [STORAGE_KEYS.approvedDomains]: updatedDomains });
    return newState;
  });
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