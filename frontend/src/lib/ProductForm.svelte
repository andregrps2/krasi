<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { propertyDefinitions } from "../stores";
  import type { StockItemOld as StockItem } from "../types-new";

  // If an item is passed, we're in edit mode. Otherwise, we're in add mode.
  export let item: StockItem | null = null;

  // Local state for all form fields
  let formData: Record<string, string> = {};
  let quantity = 1;

  // When the component mounts, populate the form based on the properties defined.
  onMount(() => {
    // Initialize formData with keys for all defined properties
    $propertyDefinitions.forEach((prop) => {
      formData[prop.id] = "";
    });

    // If we are editing an existing item, fill the form with its data.
    if (item) {
      quantity = item.quantity;
      // Overwrite the initial values with the item's actual properties
      for (const key in item.properties) {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
          formData[key] = item.properties[key];
        }
      }
    }
  });

  const dispatch = createEventDispatcher();

  function handleSubmit() {
    console.log("📝 [FORM] formData antes de criar savedItem:", formData);

    const savedItem: Partial<StockItem> = {
      id: item?.id,
      name: formData.name || "",
      price: parseFloat(formData.price || "0"),
      quantity: quantity,
      brand: formData.brand || "",
      category: formData.category || "",
      properties: { ...formData },
    };

    console.log("💾 [FORM] savedItem criado:", savedItem);
    dispatch("save", savedItem);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <div class="form-grid">
    <!-- Dynamically generate a form field for each property -->
    {#each $propertyDefinitions as prop (prop.id)}
      <div class="form-field">
        <label for={`prop-${prop.id}`}>{prop.name}</label>
        {#if prop.type === "text"}
          <input
            type="text"
            id={`prop-${prop.id}`}
            bind:value={formData[prop.id]}
            required
          />
        {:else if prop.type === "select"}
          <select
            id={`prop-${prop.id}`}
            bind:value={formData[prop.id]}
            required
          >
            <option value="" disabled>Selecione...</option>
            {#each prop.options || [] as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/each}

    <!-- The quantity field is always present -->
    <div class="form-field">
      <label for="quantity">Quantidade</label>
      <input
        type="number"
        id="quantity"
        bind:value={quantity}
        min="1"
        required
      />
    </div>
  </div>
  <button type="submit">Salvar</button>
</form>

<style>
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  .form-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  button {
    width: 100%;
    margin-top: 1.5rem;
  }
</style>
