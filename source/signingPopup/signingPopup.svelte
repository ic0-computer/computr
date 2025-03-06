<script lang="ts">
  import browser from "webextension-polyfill";

  let commandDetails: any = {};
  let signedResponse: string = "";
  let dfxCommand: string = "";

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "signingDetails") {
      commandDetails = message.data;
      dfxCommand = `dfx canister call ${commandDetails.canisterId} ${commandDetails.methodName} '${commandDetails.candidArgs}'`;
      console.log("Command details:", commandDetails);
    }
  });

  const submitSignedResponse = () => {
    browser.runtime.sendMessage({ type: "signedResponse", data: signedResponse })
      .then(() => window.close())
      .catch((error) => console.error("Error sending response:", error));
  };
</script>

<div class="mac-window font-mono w-full h-full flex flex-col bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
  <!-- Window Title Bar -->
  <div class="title-bar flex justify-between items-center border-b-2 border-black px-2 py-1 bg-gray-200">
    <span class="text-sm font-bold">Computr Signing</span>
    <div class="flex gap-1">
      <div class="w-3 h-3 border-2 border-black"></div>
      <div class="w-3 h-3 border-2 border-black"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="content flex-1 p-4 flex flex-col gap-3 overflow-auto">
    <p class="text-sm text-center">Execute this command externally and paste the signed response:</p>
    <pre class="text-xs bg-gray-100 border-2 border-black p-2 overflow-auto">{dfxCommand || "Waiting for command details..."}</pre>
    <textarea 
      bind:value={signedResponse} 
      placeholder="Paste signed response here"
      class="w-full h-24 border-2 border-black p-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black pixelated resize-none"
    ></textarea>
    <button 
      on:click={submitSignedResponse}
      class="btn border-2 border-black bg-white px-3 py-1 hover:bg-gray-200 active:shadow-[2px_2px_0_0_#000] transition-all self-center"
    >
      Submit
    </button>
  </div>
</div>

<style>
  .font-mono {
    font-family: 'Courier New', Courier, monospace;
  }
  .pixelated {
    image-rendering: pixelated;
  }
  .btn {
    box-shadow: 2px 2px 0 0 #000;
  }
  .btn:active {
    transform: translate(2px, 2px);
  }
</style>