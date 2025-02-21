<script lang="ts">
  import { appStore, updateStore } from '../store/store';

  // Subscribe to the settings section of the appStore
  $: settings = $appStore.settings;

  const updateDisplayHelpMessage = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    updateStore('settings', { displayHelpMessage: target.checked });
  };
</script>

<h1>Settings</h1>
<section>
  <form>
    <div class="form-group">
      <input
        type="checkbox"
        id="show-help-message"
        bind:checked={settings.displayHelpMessage}
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