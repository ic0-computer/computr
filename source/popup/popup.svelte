<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, updateStore, deletePrincipal } from '../store/store';

  let inputValue = '';
  let errorMessage = '';

  let principalId = '';
  $: ({ principal } = $appStore);
  $: principalId = principal.principalId || '';
  $: inputValue = principalId;

  onMount(() => {});

  const savePrincipalId = async () => {
    if (!inputValue) {
      errorMessage = 'Principal ID cannot be empty';
      return;
    }
    const error = await updateStore('principal', { principalId: inputValue });
    errorMessage = error || '';
  };

  const handleDeletePrincipal = async () => {
    await deletePrincipal();
    inputValue = '';
    errorMessage = '';
  };
</script>

<div class="mac-window font-mono w-full h-full flex flex-col bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
  <!-- Window Title Bar -->
  <div class="title-bar flex justify-between items-center border-b-2 border-black px-2 py-1 bg-gray-200">
    <span class="text-sm font-bold">Computr</span>
    <div class="flex gap-1">
      <div class="w-3 h-3 border-2 border-black"></div>
      <div class="w-3 h-3 border-2 border-black"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="content flex-1 p-4 flex flex-col gap-3 overflow-auto">
    <label class="flex flex-col gap-1">
      <span class="text-sm">Principal ID:</span>
      <input 
        type="text" 
        bind:value={inputValue} 
        on:input={() => (errorMessage = '')}
        class="w-full border-2 border-black p-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black pixelated"
        placeholder="Enter ID"
      />
    </label>

    <div class="flex gap-2 justify-center">
      <button 
        on:click={savePrincipalId}
        class="btn border-2 border-black bg-white px-3 py-1 hover:bg-gray-200 active:shadow-[2px_2px_0_0_#000] transition-all"
      >
        Save
      </button>
      <button 
        on:click={handleDeletePrincipal}
        class="btn border-2 border-black bg-white px-3 py-1 hover:bg-gray-200 active:shadow-[2px_2px_0_0_#000] transition-all"
      >
        Delete
      </button>
    </div>

    {#if errorMessage}
      <p class="text-sm text-red-600 bg-red-100 border border-red-600 p-1 text-center">
        {errorMessage}
      </p>
    {/if}

    <p class="text-sm">
      Stored ID: <span class="font-bold">{principalId || "None"}</span>
    </p>
  </div>
</div>

<style>
  .pixelated {
    image-rendering: pixelated;
  }
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