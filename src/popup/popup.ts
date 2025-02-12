import App from './popup.svelte';
import browser from 'webextension-polyfill';

// Default value for Principal ID
const defaultValues = { principalId: '' };

// Get stored Principal ID
browser.storage.local.get(['principalId']).then((result) => {
  const props = { ...defaultValues, ...result };

  // Ensure principalId exists in storage
  browser.storage.local.set(props).catch((error) => {
    console.error('Error initializing principalId:', error);
  });

  // Launch Svelte app
  new App({
    target: document.getElementById('root') as HTMLDivElement,
    props,
  });
}).catch((error) => {
  console.error('Error launching popup:', error);
});
