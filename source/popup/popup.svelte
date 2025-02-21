<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, updateStore, deletePrincipal } from '../store/store';

  let inputValue = '';
  let errorMessage = '';

  // Subscribe to the principal section of the appStore
  let principalId = '';
  $: ({ principal } = $appStore);
  $: principalId = principal.principalId || '';
  $: inputValue = principalId;

  // Load store on mount (no need for separate loadPrincipal, appStore auto-loads)
  onMount(() => {
    // Store is already initialized in store.ts, so no explicit load needed here
  });

  // Save Principal ID
  const savePrincipalId = async () => {
    if (!inputValue) {
      errorMessage = 'Principal ID cannot be empty';
      return;
    }

    const error = await updateStore('principal', { principalId: inputValue });
    if (error) {
      errorMessage = error; // Show validation error
    } else {
      errorMessage = ''; // Clear error if successful
    }
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
    <input type="text" bind:value={inputValue} on:input={() => (errorMessage = '')} />
  </label>
  <button on:click={savePrincipalId}>Save</button>
  <button on:click={handleDeletePrincipal}>Delete</button>
  
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
    font-size: 0.9em;
  }
</style>