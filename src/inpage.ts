import { BrowserRPC } from "../provider/browser-rpc/dist/index";
import { Provider } from "../provider/plug-inpage-provider/dist/src/index";

// Initialize BrowserRPC
const clientRPC = new BrowserRPC(window, {
  name: "my-inpage-provider",
  target: "my-content-script",
  timeout: 20000, // Adjust timeout as needed
});

// Start the clientRPC
clientRPC.start();

// Create and initialize the provider
const provider = new Provider(clientRPC, window);
provider.init();

// Optionally expose additional methods
provider.expose("sayHello", (args: { name: string }, callback: Function) => {
  const result = `Hello, ${args.name}!`;
  callback(null, result);
});

// Expose the provider under `window.ic`
const ic = window.ic || {};
window.ic = {
  ...ic,
  myExtension: provider, // Use a unique namespace for your extension
};

console.log("Inpage script initialized, window.ic:", window.ic);

export default provider;
