import App from './popup.svelte';
import browser from 'webextension-polyfill';
import { IDL } from '@dfinity/candid';

// Default values for storage keys (matching expected types)
const defaultValues = {
  message: 'Default message',
  idl: [], // Default to an empty array
  call: IDL.Text, // Default to a valid `IDL.Type`
};

// Get multiple items from local storage
browser.storage.local
  .get(['message', 'idl', 'call'])
  .then((result) => {
    // Merge result with default values
    const props = { 
      ...defaultValues, 
      ...result, 
      idl: Array.isArray(result.idl) ? result.idl : defaultValues.idl, // Ensure `idl` is an array
      call: result.call && typeof result.call.display === 'function' 
        ? result.call 
        : defaultValues.call, // Ensure `call` is a valid `IDL.Type`
    };

    // Initialize missing keys in storage
    browser.storage.local.set(props).catch((error) => {
      console.error('Error initializing missing keys:', error);
    });

    // Debugging: Log props to ensure correctness
    console.log('Props being passed to App:', props);

    // Launch the Svelte app
    new App({
      target: document.getElementById('root') as HTMLDivElement,
      props, // Pass props directly
    });
  })
  .catch((error) => {
    console.error('Error launching popup:', error.message || error);
  });
