import browser from 'webextension-polyfill';

console.log('Content script running...');

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  const message = event.data;

  // Check if message is coming from your desired source
  if (typeof message === "object" && message.source === "dataaccessgateway-agent") {
    console.log("Message received in content script:", message.payload);

    browser.storage.local.set({ message: message.payload.text });

    browser.runtime.sendMessage(message.payload);
  }
});

