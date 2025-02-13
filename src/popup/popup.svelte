<script lang="ts">
  import browser from 'webextension-polyfill';
  import { Principal } from '@dfinity/principal';

  // Set a default value here to ensure principalId is never undefined.
  export let principalId: string = '';

  let inputValue = principalId;
  let errorMessage = '';

  function isValidPrincipal(text: string): boolean {
    try {
      Principal.fromText(text);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Save Principal ID
  const savePrincipalId = async () => {
    if (isValidPrincipal(inputValue)) {
      await browser.storage.local.set({ principalId: inputValue });
      principalId = inputValue;
      errorMessage = '';
    } else {
      errorMessage = 'Invalid Principal ID';
    }
  };

  // Delete Principal ID
  const deletePrincipalId = async () => {
    await browser.storage.local.remove('principalId');
    principalId = '';
    inputValue = '';
    errorMessage = '';
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
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
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
  .error {
    color: red;
  }
</style>
