import { BackgroundController } from "@fleekhq/browser-rpc";
import browser from "webextension-polyfill";

const backgroundController = new BackgroundController({
  name: "computr-background",
  trustedSources: ["computr-content-script"],
});

// Store of approved domains (cached in memory)
let approvedDomains = new Set<string>();
let pendingRequests = new Set<string>(); // Tracks active requests

// Load approved domains from storage on startup
async function loadApprovedDomains() {
  const storedData = await browser.storage.local.get("ic.computr.approvedDomains");
  approvedDomains = new Set(storedData["ic.computr.approvedDomains"] || []);
}
loadApprovedDomains();

// Save approved domains to storage
async function saveApprovedDomains() {
  await browser.storage.local.set({ "ic.computr.approvedDomains": Array.from(approvedDomains) });
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
    });

    // Listen for user response
    browser.runtime.onMessage.addListener(function listener(message) {
      if (message.type === "requestConnectResponse") {
        browser.runtime.onMessage.removeListener(listener);
        resolve(message.response);
      }
    });
  });
}

backgroundController.exposeController("requestConnect", (opts, data) => {
  const { callback } = opts; // Correctly extract callback

  console.log("Received opts:", opts);
  console.log("Received data:", data); // Should log the actual arguments

  const origin = data?.origin || opts.sender?.name || null;
  
  if (!origin) {
    return callback({ code: 4000, message: "Missing origin" }, null);
  }

  // Prevent multiple popups for the same domain
  if (pendingRequests.has(origin)) {
    return callback({ code: 4002, message: "Request already in progress" }, null);
  }

  // If domain is already approved, return success
  if (approvedDomains.has(origin)) {
    return callback(null, "Successfully connected!");
  }

  pendingRequests.add(origin);
  console.log("Opening connection approval popup...");

  openApprovalPopup(origin)
    .then((result) => {
      pendingRequests.delete(origin);

      if (result === "accepted") {
        approvedDomains.add(origin);
        saveApprovedDomains();
        return callback(null, "Successfully connected!");
      } else {
        return callback({ code: 4001, message: "User rejected the request" }, null);
      }
    })
    .catch((error) => {
      pendingRequests.delete(origin);
      return callback({ code: 5000, message: "Unexpected error", data: error }, null);
    });
    
});

// Start background RPC server
backgroundController.start();
