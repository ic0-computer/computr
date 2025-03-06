<script lang="ts">
  import browser from "webextension-polyfill";

  const acceptRequest = () => {
    console.log("Accept clicked, sending message...");
    browser.runtime.sendMessage({ type: "requestConnectResponse", response: "accepted" })
      .then(() => {
        console.log("Message sent successfully!");
        window.close();
      })
      .catch((error) => console.error("Error sending message:", error));
  };

  const rejectRequest = () => {
    console.log("Reject clicked, sending message...");
    browser.runtime.sendMessage({ type: "requestConnectResponse", response: "rejected" })
      .then(() => {
        console.log("Message sent successfully!");
        window.close();
      })
      .catch((error) => console.error("Error sending message:", error));
  };
</script>

<div class="mac-window font-mono w-full h-full flex flex-col bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
  <!-- Window Title Bar -->
  <div class="title-bar flex justify-between items-center border-b-2 border-black px-2 py-1 bg-gray-200">
    <span class="text-sm font-bold">Computr Connection</span>
    <div class="flex gap-1">
      <div class="w-3 h-3 border-2 border-black"></div>
      <div class="w-3 h-3 border-2 border-black"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="content flex-1 p-4 flex flex-col gap-3 overflow-auto">
    <p class="text-sm text-center">Do you want to approve this connection?</p>
    <div class="flex gap-2 justify-center">
      <button 
        on:click={acceptRequest}
        class="btn border-2 border-black bg-white px-3 py-1 hover:bg-gray-200 active:shadow-[2px_2px_0_0_#000] transition-all"
      >
        Accept
      </button>
      <button 
        on:click={rejectRequest}
        class="btn border-2 border-black bg-white px-3 py-1 hover:bg-gray-200 active:shadow-[2px_2px_0_0_#000] transition-all"
      >
        Reject
      </button>
    </div>
  </div>
</div>

<style>
  .font-mono {
    font-family: 'Courier New', Courier, monospace;
  }
  .btn {
    box-shadow: 2px 2px 0 0 #000;
  }
  .btn:active {
    transform: translate(2px, 2px);
  }
</style>