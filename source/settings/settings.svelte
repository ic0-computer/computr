<script lang="ts">
  import { appStore, updateStore } from '../store/store';

  $: settings = $appStore.settings;

  const updateDisplayHelpMessage = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    updateStore('settings', { displayHelpMessage: target.checked });
  };
</script>

<div class="mac-window font-mono w-full h-full flex flex-col bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
  <!-- Window Title Bar -->
  <div class="title-bar flex justify-between items-center border-b-2 border-black px-2 py-1 bg-gray-200">
    <span class="text-sm font-bold">Computr Settings</span>
    <div class="flex gap-1">
      <div class="w-3 h-3 border-2 border-black"></div>
      <div class="w-3 h-3 border-2 border-black"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="content flex-1 p-4 flex flex-col gap-3 overflow-auto">
    <form class="flex flex-col gap-2">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-help-message"
          bind:checked={settings.displayHelpMessage}
          on:change={updateDisplayHelpMessage}
          class="w-4 h-4 border-2 border-black pixelated"
        />
        <span class="text-sm">Show help message in console</span>
      </label>
    </form>
  </div>
</div>

<style>
  .font-mono {
    font-family: 'Courier New', Courier, monospace;
  }
  .pixelated {
    image-rendering: pixelated;
  }
</style>