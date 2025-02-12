<script lang="ts">
  import browser from 'webextension-polyfill';

  export let principalId: string;

  let inputValue = principalId;

  // Save Principal ID
  const savePrincipalId = async () => {
    await browser.storage.local.set({ principalId: inputValue });
    principalId = inputValue;
  };

  // Delete Principal ID
  const deletePrincipalId = async () => {
    await browser.storage.local.remove('principalId');
    principalId = '';
    inputValue = '';
  };
</script>

<div>
  <h1>Computr</h1>
  <label>
    Principal ID:
    <input type="text" bind:value={inputValue} />
  </label>
  <button on:click={savePrincipalId}>Save</button>
  <button on:click={deletePrincipalId}>Delete</button>
  <p>Stored ID: {principalId || "None"}</p>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  input {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  button {
    margin-top: 5px;
    padding: 5px 10px;
    cursor: pointer;
  }
</style>
