import App from './popup.svelte';
import browser from 'webextension-polyfill';

// Get the message from local storage
browser.storage.local.get('message').then((result) => {
  const msg = result.message ? result.message : '';
  new App({ target: document.getElementById('root') as HTMLDivElement, props: { msg } });
}).catch((error) => {
  console.error('Error launching popup:', error);
});
