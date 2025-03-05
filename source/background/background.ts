// source/background/background.ts
import { BackgroundController } from "@fleekhq/browser-rpc";
import browser from "webextension-polyfill";
import { IDL } from "@dfinity/candid";

const backgroundController = new BackgroundController({
  name: "computr-background",
  trustedSources: ["computr-content-script"],
});

// Store of approved domains (cached in memory)
let approvedDomains = new Set<string>();
let pendingRequests = new Set<string>();

// Load approved domains from storage on startup
async function loadApprovedDomains() {
  const storedData = await browser.storage.local.get("ic.computr.approvedDomains");
  const loadedDomains = storedData["ic.computr.approvedDomains"] || [];
  approvedDomains = new Set(loadedDomains);
  console.log("Loaded approved domains:", Array.from(approvedDomains));
}
loadApprovedDomains();

// Save approved domains to storage
async function saveApprovedDomains() {
  const domainsArray = Array.from(approvedDomains);
  await browser.storage.local.set({ "ic.computr.approvedDomains": domainsArray });
  console.log("Saved approved domains:", domainsArray);
}

// Open approval popup
async function openApprovalPopup(origin: string): Promise<"accepted" | "rejected"> {
  return new Promise((resolve) => {
    console.log(`Opening approval popup for: ${origin}`);

    browser.windows.create({
      url: browser.runtime.getURL("public/connect.html"),
      type: "popup",
      width: 400,
      height: 300,
    }).then((window) => {
      console.log("Popup window created:", window);
    }).catch((error) => {
      console.error("Failed to create popup:", error);
    });

    browser.runtime.onMessage.addListener(function listener(message) {
      console.log("Received message:", message);
      if (message.type === "requestConnectResponse") {
        browser.runtime.onMessage.removeListener(listener);
        resolve(message.response);
      }
    });
  });
}

// Handle requestConnect
backgroundController.exposeController("requestConnect", (opts, data) => {
  const { callback } = opts;
  const origin = data?.origin;

  console.log("requestConnect - Data:", data, "Origin:", origin, "Approved domains:", Array.from(approvedDomains));

  if (!origin || typeof origin !== "string") {
    return callback({ code: 4000, message: "Missing or invalid origin" }, null);
  }

  if (pendingRequests.has(origin)) {
    return callback({ code: 4002, message: "Request already in progress" }, null);
  }

  if (approvedDomains.has(origin)) {
    console.log(`${origin} already approved, skipping popup`);
    return callback(null, "Successfully connected!");
  }

  pendingRequests.add(origin);
  console.log("Opening connection approval popup...");

  openApprovalPopup(origin)
    .then((result) => {
      pendingRequests.delete(origin);
      console.log(`Popup result for ${origin}:`, result);

      if (result === "accepted") {
        approvedDomains.add(origin);
        saveApprovedDomains();
        callback(null, "Successfully connected!");
      } else {
        callback({ code: 4001, message: "User rejected the request" }, null);
      }
    })
    .catch((error) => {
      pendingRequests.delete(origin);
      console.error("Popup error:", error);
      callback({ code: 5000, message: "Unexpected error", data: error }, null);
    });
});

// Handle isConnected
backgroundController.exposeController("isConnected", (opts, data) => {
  const { callback } = opts;
  const origin = data?.origin;

  console.log("isConnected - Data:", data, "Origin:", origin, "Approved domains:", Array.from(approvedDomains));

  if (!origin || typeof origin !== "string") {
    return callback({ code: 4000, message: "Missing or invalid origin" }, null);
  }

  const isConnected = approvedDomains.has(origin);
  callback(null, isConnected);
});

// Handle disconnect
backgroundController.exposeController("disconnect", (opts, data) => {
  const { callback } = opts;
  const origin = data?.origin;

  console.log("disconnect - Data:", data, "Origin:", origin, "Approved domains:", Array.from(approvedDomains));

  if (!origin || typeof origin !== "string") {
    return callback({ code: 4000, message: "Missing or invalid origin" }, null);
  }

  if (!approvedDomains.has(origin)) {
    callback(null, "Already disconnected");
    return;
  }

  approvedDomains.delete(origin);
  saveApprovedDomains();
  callback(null, "Disconnected successfully");
});

// Handle getPrincipal
backgroundController.exposeController("getPrincipal", async (opts, data) => {
  const { callback } = opts;
  const origin = data?.origin;

  console.log("getPrincipal - Data:", data, "Origin:", origin, "Approved domains:", Array.from(approvedDomains));

  try {
    if (origin && !approvedDomains.has(origin)) {
      console.log("Domain not approved for principal access:", origin);
      callback(null, null); // Return null if not approved
      return;
    }

    const storedData = await browser.storage.local.get("ic.computr.principal");
    console.log("Raw stored data:", storedData);
    const principalData = storedData["ic.computr.principal"] || { principalId: null };
    const principalId = principalData.principalId;

    console.log("getPrincipal - Retrieved principalId:", principalId);

    callback(null, principalId); // Return principalId or null
  } catch (error) {
    console.error("Error fetching principal:", error);
    callback({ code: 5000, message: "Failed to fetch principal", data: error }, null);
  }
});

backgroundController.exposeController("signQuery", async (opts, data) => {
  const { callback } = opts;
  const signedResponse = await openSigningPopup(data);
  callback(null, signedResponse);
});

async function openSigningPopup(data: any): Promise<string> {
  return new Promise((resolve) => {
    browser.windows.create({
      url: browser.runtime.getURL("public/signingPopup.html"),
      type: "popup",
      width: 400,
      height: 600,
    }).then((window) => {
      setTimeout(() => {
        browser.runtime.sendMessage({ type: "signingDetails", data });
      }, 100);

      browser.runtime.onMessage.addListener(function handler(message) {
        if (message.type === "signedResponse") {
          resolve(message.data);
          browser.windows.remove(window.id!);
          browser.runtime.onMessage.removeListener(handler);
        }
      });
    });
  });
}

// Start background RPC server
backgroundController.start();