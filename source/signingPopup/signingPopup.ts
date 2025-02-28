//@ts-ignore
import ConnectApp from "./signingPopup.svelte";

const target = document.getElementById("signing-root");
if (!target) {
  console.error("Error: Cannot find element with id 'signing-root'");
} else {
  new ConnectApp({ target });
}
