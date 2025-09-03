<script lang="ts">
  import { propertyDefinitions } from '../stores';

  // Binds the filter values back to the parent component.
  export let filters: Record<string, string> = {};

  // A general search term for a quick lookup across all properties.
  export let searchTerm = '';

  function clearFilters() {
    searchTerm = '';
    // Reset all property filters
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        filters[key] = '';
      }
    }
    // Trigger the two-way binding update
    filters = { ...filters };
  }
</script>

<div class="filter-controls">
  <!-- General Search Input -->
  <input
    class="search-input"
    type="text"
    placeholder="Pesquisar em todas as propriedades..."
    bind:value={searchTerm}
  />
  
  <!-- Dynamic Grid for Property-Specific Filters -->
  <div class="form-grid">
    {#each $propertyDefinitions as prop (prop.id)}
      <div>
        {#if prop.type === 'text'}
          <input 
            type="text" 
            placeholder={prop.name} 
            bind:value={filters[prop.id]} 
          />
        {:else if prop.type === 'select'}
          <select bind:value={filters[prop.id]}>
            <option value="">Todos ({prop.name})</option>
            {#each prop.options || [] as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/each}

    <!-- Clear Button -->
    <button class="outline" on:click={clearFilters}>Limpar Filtros</button>
  </div>
</div>

<style>
  .search-input {
    width: 100%;
    margin-bottom: 1rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    align-items: center;
  }
  button.outline {
    background-color: transparent;
    border: 1px solid var(--primary-color-border);
    color: var(--primary-color);
  }
  button.outline:hover {
    background-color: rgba(250, 204, 21, 0.1);
  }
</style>
