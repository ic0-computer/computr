import browser from "webextension-polyfill";

// Utility function to inject the inpage script
function injectScript(filePath: string | null, content: string | null) {
  const container = document.head || document.documentElement;
  const script = document.createElement("script");

  script.setAttribute("async", "false");
  script.setAttribute("type", "text/javascript");

  if (content) {
    script.textContent = content; // Inject inline script
  }

  if (filePath) {
    script.setAttribute("src", filePath); // Inject script from filePath
  }

  container.appendChild(script);
  script.onload = () => script.remove();
}

// Inline the inpage script content
import INPAGE_SCRIPT from "./inpage.ts?raw";

// Inject the inpage script inline
injectScript(null, INPAGE_SCRIPT);

// Set up ProxyRPC for communication
import { ProxyRPC } from "../provider/browser-rpc/dist/index";

console.log("Content script running...");

const serverRPC = new ProxyRPC(window, {
  name: "my-content-script",
  target: "my-inpage-provider",
});

// Example: Expose a test handler for RPC
serverRPC.exposeHandler("test", (props: { callback: Function }, name: string) => {
  const { callback } = props;
  const result = `Hello, ${name}!`;
  callback(null, result);
});

serverRPC.start();

// Example listener to capture and forward messages to storage
window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  const message = event.data;

  if (typeof message === "object" && message.source === "dataaccessgateway-agent") {
    console.log("Message received in content script:", message.payload);

    browser.storage.local.set({
      message: message.payload.text,
      idl: message.payload.idl,
      call: message.payload.call,
    });

    browser.runtime.sendMessage(message.payload);
  }
});
