import { BrowserRPC } from '@fleekhq/browser-rpc';
import { Provider } from '@funded-labs/plug-inpage-provider';

// Step 1: Initialize BrowserRPC for communication with the content script
const clientRPC = new BrowserRPC(window, {
  name: 'my-inpage-provider',
  target: 'my-content-script',
  timeout: 20000, // Adjust based on your needs
});
clientRPC.start();

// Step 2: Initialize the provider (acting as a bridge)
const provider = new Provider(clientRPC, window);
provider.init();

// Step 3: Define RPC handlers that allow communication from the web page
clientRPC.exposeHandler('sayHello', (args: { name: string }, callback: Function) => {
  const result = `Hello, ${args.name}!`;
  callback(null, result);
});

// Step 4: Attach the provider to `window.ic` so the webpage can access it
const ic = window.ic || {};
window.ic = {
  ...ic,
  computr: provider, // Unique namespace for your extension
};

console.log('✅ inpage.js injected and initialized!', window.ic);

// Step 5: Test message sending (Optional)
window.postMessage({ source: 'inpage.js', message: 'Injected successfully!' }, '*');

export default provider;
