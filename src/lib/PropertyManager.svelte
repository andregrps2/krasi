<script lang="ts">
  import { propertyDefinitions, stock } from '../stores';
  import type { PropertyDefinition } from '../types';
  import Modal from './Modal.svelte';
  import PropertyForm from './PropertyForm.svelte';

  let showPropertyFormModal = false;
  let editingProperty: PropertyDefinition | null = null;

  function openAddPropertyModal() {
    editingProperty = null;
    showPropertyFormModal = true;
  }

  function openEditPropertyModal(prop: PropertyDefinition) {
    editingProperty = prop;
    showPropertyFormModal = true;
  }

  function handleSaveProperty(event: CustomEvent<PropertyDefinition>) {
    const newProperty = event.detail;

    if (editingProperty) {
      $propertyDefinitions = $propertyDefinitions.map(p => p.id === editingProperty!.id ? newProperty : p);
    } else {
      if ($propertyDefinitions.some(p => p.id === newProperty.id)) {
        alert('Já existe uma propriedade com um ID similar. Escolha um nome diferente.');
        return;
      }
      $propertyDefinitions = [...$propertyDefinitions, newProperty];
    }

    showPropertyFormModal = false;
  }

  function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta propriedade? Ela será removida de TODOS os itens do estoque.')) {
      // Remove the property definition
      $propertyDefinitions = $propertyDefinitions.filter(p => p.id !== id);

      // Remove the corresponding property data from all stock items
      $stock = $stock.map(item => {
        if (item.properties && item.properties[id]) {
          delete item.properties[id];
        }
        return item;
      });
    }
  }
</script>

<Modal bind:show={showPropertyFormModal}>
  <h2>{editingProperty ? 'Editar' : 'Adicionar'} Propriedade</h2>
  <PropertyForm 
    isEditing={!!editingProperty} 
    initialData={editingProperty || {}} 
    on:save={handleSaveProperty} 
    on:cancel={() => showPropertyFormModal = false} 
  />
</Modal>

<div class="manager-container">
  <button class="primary add-new" on:click={openAddPropertyModal}>+ Adicionar Nova Propriedade</button>

  <hr />

  <div class="list-section">
    <h3>Propriedades Existentes</h3>
    {#if $propertyDefinitions.length === 0}
      <p>Nenhuma propriedade definida. Comece adicionando uma!</p>
    {:else}
      <ul>
        {#each $propertyDefinitions as prop (prop.id)}
          <li>
            <div class="prop-info">
              <span class="prop-name">{prop.name}</span>
              <span class="prop-type">({prop.type})</span>
            </div>
            <div class="prop-actions">
              <button class="secondary sm" on:click={() => openEditPropertyModal(prop)}>Editar</button>
              <button class="danger sm" on:click={() => handleDelete(prop.id)}>Excluir</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .manager-container {
    padding: 0.5rem;
  }
  hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 2rem 0;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  li:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  .prop-name {
    font-weight: bold;
  }
  .prop-type {
    margin-left: 0.5rem;
    font-size: 0.8em;
    color: #aaa;
  }
  .prop-actions {
    display: flex;
    gap: 0.5rem;
  }
  button.add-new {
    width: 100%;
  }
</style>
