import App from './popup.svelte';
import browser from 'webextension-polyfill';

// Get multiple items from local storage
browser.storage.local.get(['message', 'idl', 'call']).then((result) => {
  // Check if any key is missing in the result
  const hasAllKeys = Object.keys(result).length === 3;

  if (hasAllKeys) {
    // Destructure retrieved values (assuming you prefer destructuring)
    const { message, idl, call } = result;

    new App({ target: document.getElementById('root') as HTMLDivElement, props: { message, idl, call } });
  } else {
    // Handle the case where some keys are missing
    console.error('Error: Missing data in storage. Keys:', Object.keys(result));
  }
}).catch((error) => {
  console.error('Error launching popup:', error);
});
