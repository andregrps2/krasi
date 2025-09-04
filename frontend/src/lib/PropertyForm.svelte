<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { PropertyDefinition } from '../types';

  export let isEditing = false;
  export let initialData: Partial<PropertyDefinition> = {};

  let propName = '';
  let propType: 'text' | 'select' = 'text';
  let propOptions = '';

  onMount(() => {
    propName = initialData.name || '';
    propType = initialData.type || 'text';
    propOptions = initialData.options ? initialData.options.join('\n') : '';
  });

  const dispatch = createEventDispatcher();

  function handleSubmit() {
    if (!propName) {
      alert('O nome da propriedade é obrigatório.');
      return;
    }

    const newProperty: Partial<PropertyDefinition> = {
      id: isEditing ? initialData.id : propName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      name: propName,
      type: propType,
      options: propType === 'select' ? propOptions.split('\n').filter(o => o.trim() !== '') : undefined,
    };

    dispatch('save', newProperty);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <div class="form-field">
    <label for="prop-name">Nome da Propriedade</label>
    <input id="prop-name" type="text" bind:value={propName} placeholder="Ex: Material" required />
  </div>
  <div class="form-field">
    <label for="prop-type">Tipo de Campo</label>
    <select id="prop-type" bind:value={propType}>
      <option value="text">Texto Livre</option>
      <option value="select">Seleção de Opções</option>
    </select>
  </div>
  {#if propType === 'select'}
    <div class="form-field">
      <label for="prop-options">Opções (uma por linha)</label>
      <textarea id="prop-options" bind:value={propOptions} rows="4" placeholder="Opção 1\nOpção 2"></textarea>
    </div>
  {/if}
  <div class="form-actions">
    <button type="button" class="secondary" on:click={() => dispatch('cancel')}>Cancelar</button>
    <button type="submit" class="primary">Salvar</button>
  </div>
</form>

<style>
  .form-field {
    margin-bottom: 1rem;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  textarea {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
</style>
