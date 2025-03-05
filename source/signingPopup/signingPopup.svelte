<!-- signingPopup.svelte -->
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

<div class="container">
  <h2>Sign Command Externally</h2>
  <p>Execute this command externally and paste the signed response:</p>
  <pre>{dfxCommand || "Waiting for command details..."}</pre>
  <textarea bind:value={signedResponse} placeholder="Paste signed response here"></textarea>
  <button on:click={submitSignedResponse}>Submit</button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  pre {
    background: #f4f4f4;
    padding: 10px;
    border-radius: 5px;
    width: 100%;
    max-width: 350px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  textarea {
    width: 100%;
    max-width: 350px;
    height: 100px;
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: none;
  }
  button {
    margin-top: 10px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:hover {
    background-color: #0056b3;
  }
</style>