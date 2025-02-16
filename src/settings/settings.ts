// @ts-ignore
import App from './settings.svelte';
import { loadSettings } from '../store/settingsStore';

// Load settings before initializing the app
loadSettings().then(() => {
<<<<<<< HEAD
  new App({
    target: document.getElementById('root') as HTMLDivElement
  });
=======
  const target = document.getElementById('root');
  if (!target) {
    console.error('Error: Cannot find element with id "root"');
    return;
  }
  new App({
    target,
  });
}).catch((error) => {
  console.error('Error loading settings:', error);
>>>>>>> bded19e
});
