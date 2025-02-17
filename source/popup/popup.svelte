<script lang="ts">
  import { get } from 'svelte/store';
  import { principalStore, updatePrincipal, deletePrincipal } from '../store/principalStore';

  let principalData = get(principalStore);
  let inputValue = principalData.principalId;
  let errorMessage = '';

  // Save Principal ID
  const savePrincipalId = async () => {
    if (!inputValue) {
      errorMessage = 'Principal ID cannot be empty';
      return;
    }
    await updatePrincipal(inputValue);
    errorMessage = '';
  };

  // Delete Principal ID
  const handleDeletePrincipal = async () => {
    await deletePrincipal();
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
  <button on:click={handleDeletePrincipal}>Delete</button>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  <p>Stored ID: {inputValue || "None"}</p>
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
