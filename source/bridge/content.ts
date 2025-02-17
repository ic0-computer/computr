import browser from 'webextension-polyfill';
import { ProxyRPC } from '@fleekhq/browser-rpc';

const injectScript = (filePath) => {
  const container = document.head || document.documentElement;
  const script = document.createElement("script");

  script.setAttribute("async", "false");
  script.setAttribute("type", "text/javascript");
  script.src = chrome.runtime.getURL(filePath);

  container.insertBefore(script, container.children[0]);
};

injectScript("dist/inpage.js");

// Set up your content script RPC server (communication bridge)
const serverRPC = new ProxyRPC(window, {
  name: 'my-content-script',
  target: 'my-inpage-provider',
});

// Expose a test handler (for example)
serverRPC.exposeHandler('test', (props: { callback: Function }, name: string) => {
  const result = `Hello, ${name}!`;
  props.callback(null, result);
});
serverRPC.start();

// Optionally, listen for window messages and forward them to your background or storage.
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const message = event.data;
  if (typeof message === 'object' && message.source === 'dataaccessgateway-agent') {
    browser.storage.local.set({
      message: message.payload.text,
      idl: message.payload.idl,
      call: message.payload.call,
    });
    browser.runtime.sendMessage(message.payload);
  }
});