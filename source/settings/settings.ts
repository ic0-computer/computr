// @ts-ignore
import App from './settings.svelte';
import { loadStore } from '../store/store';

// Load store before initializing the app
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
    console.error('Error loading settings:', error);
  });