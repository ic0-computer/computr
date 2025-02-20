<script lang="ts">
import browser from "webextension-polyfill";

// Accept connection request
const acceptRequest = () => {
  console.log("Accept clicked, sending message...");
  browser.runtime.sendMessage({ type: "requestConnectResponse", response: "accepted" })
    .then(() => {
      console.log("Message sent successfully!");
      window.close();
    })
    .catch((error) => console.error("Error sending message:", error));
};

// Reject connection request
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
  
  <div class="container">
    <h2>Computr Connection Request</h2>
    <p>Do you want to approve this connection?</p>
    
    <button on:click={acceptRequest} class="accept">Accept</button>
    <button on:click={rejectRequest} class="reject">Reject</button>
  </div>
  
  <style>
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    button {
      margin: 5px;
      padding: 10px 20px;
      cursor: pointer;
    }
    .accept {
      background-color: green;
      color: white;
    }
    .reject {
      background-color: red;
      color: white;
    }
  </style>
  