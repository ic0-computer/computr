import browser from "webextension-polyfill";
import { ProxyRPC } from "@fleekhq/browser-rpc";

// Inject inpage.js
const injectScript = (filePath) => {
  const container = document.head || document.documentElement;
  const script = document.createElement("script");

  script.setAttribute("async", "false");
  script.setAttribute("type", "text/javascript");
  script.src = chrome.runtime.getURL(filePath);

  container.insertBefore(script, container.children[0]);
};

injectScript("dist/inpage.js");

// Set up content script RPC
const serverRPC = new ProxyRPC(window, {
  name: "computr-content-script",
  target: "computr-provider",
});

// Relay messages from inpage.js to background.js
serverRPC.exposeHandler("relayToBackground", async (message) => {
  console.log("Forwarding message to background:", message);
  return await browser.runtime.sendMessage(message);
});

serverRPC.start();
