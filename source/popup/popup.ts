import App from './popup.svelte';
import browser from 'webextension-polyfill';
import { Principal } from '@dfinity/principal';

// Default value for Principal ID
const defaultValues = { principalId: '' };

// Function to validate Principal ID
function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch (error) {
    return false;
  }
}

// Get stored Principal ID and ensure we have a valid object
browser.storage.local.get(['principalId']).then((result) => {
  const stored = result || {};
  // Merge default values with stored values. If stored.principalId is undefined, default to an empty string.
  const props = { ...defaultValues, ...stored };
  
  // Validate stored principalId, reset to '' if invalid
  if (props.principalId && !isValidPrincipal(props.principalId)) {
    props.principalId = '';
  }

  // Write the props back to storage in case it was missing or invalid
  browser.storage.local.set(props).catch((error) => {
    console.error('Error initializing principalId:', error);
  });

  // Launch Svelte app, ensuring that the target element exists
  const target = document.getElementById('root');
  if (!target) {
    console.error('Error: Cannot find element with id "root"');
    return;
  }
  new App({
    target,
    props,
  });
}).catch((error) => {
  console.error('Error launching popup:', error);
});
