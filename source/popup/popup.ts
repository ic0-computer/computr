//@ts-ignore
import App from './popup.svelte';
import { loadStore } from '../store/store';

// Load the store and launch the app
loadStore()
  .then(() => {
    const target = document.getElementById('root');
    if (!target) {
      console.error('Error: Cannot find element with id "root"');
      return;
    }

    new App({
      target,
    });
  })
  .catch((error) => {
    console.error('Error launching popup:', error);
  });