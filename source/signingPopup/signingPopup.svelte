<!-- source/signingPopup/signingPopup.svelte -->
<script lang="ts">
  import browser from "webextension-polyfill";

  // Data received from the background script
  let commandDetails: any = {};
  let signedResponse: string = "";

  // Submit the signed response to the background script
  const submitSignedResponse = () => {
    console.log("Submitting signed response:", signedResponse);
    browser.runtime.sendMessage({ type: "signedResponse", data: signedResponse })
      .then(() => {
        console.log("Signed response sent successfully!");
        window.close();
      })
      .catch((error) => console.error("Error sending signed response:", error));
  };

  // Listen for command details from the background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "signingDetails") {
      commandDetails = message.data;
      console.log("Received command details:", commandDetails);
    }
  });
</script>

<div class="container">
  <h2>Sign Command Externally</h2>
  <p>Please execute the following command externally and paste the signed response below:</p>
  <pre>{JSON.stringify(commandDetails, null, 2)}</pre>
  <textarea bind:value={signedResponse} placeholder="Paste signed response here"></textarea>
  <button on:click={submitSignedResponse}>Submit Signed Response</button>
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