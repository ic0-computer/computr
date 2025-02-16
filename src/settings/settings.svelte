<script lang="ts">
  import { settingsStore, updateSettings } from '../store/settingsStore';
  import { get } from 'svelte/store';

<<<<<<< HEAD
  let appSettings = get(settingsStore); // Get current settings
=======
  let appSettings = get(settingsStore);
>>>>>>> bded19e

  const updateDisplayHelpMessage = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    updateSettings({ displayHelpMessage: target.checked });
  };
</script>

<h1>Settings</h1>
<section>
  <form>
    <div class="form-group">
      <input
        type="checkbox"
        id="show-help-message"
        bind:checked={appSettings.displayHelpMessage}
        on:change={updateDisplayHelpMessage}
      />
      <label for="show-help-message">Show help message in console</label>
    </div>
  </form>
</section>

<style>
  h1 {
    padding: 1em 0;
  }
</style>
