import { BackgroundController } from "@fleekhq/browser-rpc";
import browser from "webextension-polyfill";

const backgroundController = new BackgroundController({
  name: "computr-background",
  trustedSources: ["computr-content-script"],
});

async function openApprovalPopup(): Promise<"accepted" | "rejected"> {
  return new Promise((resolve, reject) => {
    console.log("Opening approval popup...");
    
    browser.windows.create({
      url: browser.runtime.getURL("public/connect.html"), // Make sure this path is correct
      type: "popup",
      width: 400,
      height: 300,
    }).then((window) => {
      console.log("Popup opened", window);
    }).catch((error) => console.error("Error opening popup:", error));

    // Listen for user response
    browser.runtime.onMessage.addListener(function listener(message) {
      console.log("Background received:", message);
      if (message.type === "requestConnectResponse") {
        browser.runtime.onMessage.removeListener(listener);
        resolve(message.response);
      }
    });
  });
}

// Handle requestConnect
backgroundController.exposeController("requestConnect", async (opts) => {
  const { callback } = opts;
  console.log("Opening connection approval popup...");

  const result = await openApprovalPopup();

  if (result === "accepted") {
    callback(null, "Successfully connected!");
  } else {
    callback({ code: 4001, message: "User rejected the request" }, null);
  }
});

// Start background RPC server
backgroundController.start();
