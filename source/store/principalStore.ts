import { writable } from 'svelte/store';
import browser from 'webextension-polyfill';
import { Principal } from '@dfinity/principal';

// Default principal store
export const DEFAULT_PRINCIPAL = { principalId: '' };

// Create a writable store for principal
export const principalStore = writable(DEFAULT_PRINCIPAL);

// Load Principal from storage
export async function loadPrincipal() {
  try {
    const result = await browser.storage.local.get('ic.computr');
    const stored = result['ic.computr'] || DEFAULT_PRINCIPAL;

    // Validate principal
    if (stored.principalId && !isValidPrincipal(stored.principalId)) {
      stored.principalId = ''; // Reset if invalid
      await browser.storage.local.set({ 'ic.computr': stored });
    }

    principalStore.set(stored);
  } catch (error) {
    console.error('Error loading principal:', error);
  }
}

// Update principal in storage
export async function updatePrincipal(principalId: string): Promise<string | null> {
  if (!isValidPrincipal(principalId)) {
    return 'Invalid Principal ID'; // Return error message instead of failing silently
  }

  const newPrincipal = { principalId };
  await browser.storage.local.set({ 'ic.computr': newPrincipal });
  principalStore.set(newPrincipal); // Ensure the store updates
  return null; // No error
}

// Remove principal from storage
export async function deletePrincipal() {
  const emptyPrincipal = { principalId: '' };
  await browser.storage.local.set({ 'ic.computr': emptyPrincipal });
  principalStore.set(emptyPrincipal);
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
