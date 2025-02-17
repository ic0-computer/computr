import App from './popup.svelte';
import browser from 'webextension-polyfill';
import { Principal } from '@dfinity/principal';
import { loadSettings, updateSettings } from '../store/settingsStore';

// Load settings and ensure a valid principal is stored
loadSettings().then(() => {
  browser.storage.local.get('ic.computr').then((result) => {
    const stored = result['ic.computr'] || {};
    
    // Ensure valid principal
    if (stored.principalId && !isValidPrincipal(stored.principalId)) {
      stored.principalId = '';
      browser.storage.local.set({ 'ic.computr': stored });
    }

    // Launch Svelte app
    const target = document.getElementById('root');
    if (!target) {
      console.error('Error: Cannot find element with id "root"');
      return;
    }
    
    new App({
      target,
      props: stored
    });
  });
}).catch(error => {
  console.error('Error launching popup:', error);
});

// Validate Principal ID
function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch (error) {
    return false;
  }
}
