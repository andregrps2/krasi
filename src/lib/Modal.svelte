<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";

  export let show = false;

  const dispatch = createEventDispatcher();

  function close() {
    show = false;
    dispatch("close");
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

{#if show}
  <div
    class="backdrop"
    on:click={close}
    on:keydown={(e) => e.key === "Escape" && close()}
    role="button"
    tabindex="0"
    aria-label="Fechar modal"
  ></div>
  <div class="modal">
    <div class="modal-content">
      <slot></slot>
    </div>
    <button class="close-button" on:click={close}>&times;</button>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 10;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--surface-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    z-index: 20;
    width: 90%;
    max-width: 500px;
  }

  .modal-content {
    padding: 2rem;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: #aaa;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }
  .close-button:hover {
    color: var(--text-color);
    background-color: transparent;
  }
</style>
