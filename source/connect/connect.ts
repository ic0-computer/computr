//@ts-ignore
import ConnectApp from "./connect.svelte";

const target = document.getElementById("connect-root");
if (!target) {
  console.error("Error: Cannot find element with id 'connect-root'");
} else {
  new ConnectApp({ target });
}
