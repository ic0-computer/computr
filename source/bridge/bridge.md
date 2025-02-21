# Browser RPC Architecture in Computr Extension

## 1. **Architecture Overview**
The Computr extension follows a structured **browser-RPC (Remote Procedure Call) system** to enable communication between different parts of the extension. The key components are:

- **Inpage Script (`inpage.ts`)**  
  - Injected into the webpage.
  - Exposes the `computr` API to the website.
  - Can **only** communicate with the **content script** (not the background script directly).

- **Content Script (`content.ts`)**  
  - Acts as a **bridge** between the inpage script and the background script.
  - Listens for messages from the inpage script and forwards them to the background script.
  - Sends responses back to the inpage script.

- **Background Script (`background.ts`)**  
  - Has access to **extension APIs** (e.g., opening a popup).
  - Handles connection requests and user approval via the popup.
  - Sends the final response back through the content script.

## 2. **How Communication Works**
The following flow ensures secure message passing:

1. **Inpage script calls `requestConnect` using `browser-rpc`.**  
   ```ts
   const client = createClient({ target: window, receiver: window });

   export const computr = {
     async requestConnect(): Promise<string> {
       return await client.call("requestConnect"); // Calls content script
     }
   };
   ```

2. **Content script listens for `requestConnect` and forwards it to the background script.**  
   ```ts
   import { createRouter } from "@psychedelic/browser-rpc";

   const router = createRouter({ target: window, receiver: window });

   router.expose("requestConnect", async () => {
     return await browser.runtime.sendMessage({ type: "requestConnect" });
   });
   ```

3. **Background script handles the request, opens a popup, and waits for user input.**  
   ```ts
   router.expose("requestConnect", async () => {
     return new Promise((resolve) => {
       browser.windows.create({ url: browser.runtime.getURL("public/connect.html") });

       browser.runtime.onMessage.addListener(function listener(message) {
         if (message.type === "requestConnectResponse") {
           browser.runtime.onMessage.removeListener(listener);
           resolve(message.response);
         }
       });
     });
   });
   ```

## 3. **Why is the Content Script Needed?**
- **Browser security prevents direct communication** between the inpage script and the background script.
- **Only content scripts** can access both the webpage’s DOM **and** `browser.runtime`, making them a required bridge.
- Prevents the webpage from abusing extension APIs by restricting message passing to controlled routes.

This structure ensures **secure, controlled** communication between the extension and the webpage while complying with browser security policies.
