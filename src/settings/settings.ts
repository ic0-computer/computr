// @ts-ignore
import App from './settings.svelte';
import { loadSettings } from '../store/settingsStore';

// Load settings before initializing the app
loadSettings().then(() => {
  new App({
    target: document.getElementById('root') as HTMLDivElement
  });
});
