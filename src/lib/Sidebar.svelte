<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let currentPage: string = "estoque";

  const dispatch = createEventDispatcher();

  function navigateTo(page: string) {
    dispatch("navigate", page);
  }

  const menuItems = [
    {
      id: "vendas",
      label: "Ponto de Venda",
      icon: "🛒",
    },
    {
      id: "estoque",
      label: "Controle de Estoque",
      icon: "📦",
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: "👥",
    },
    {
      id: "fiado",
      label: "Controle de Fiado",
      icon: "💳",
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: "📊",
    },
  ];
</script>

<nav class="sidebar">
  <div class="sidebar-header">
    <h2>Ricardo Ternos</h2>
  </div>

  <ul class="menu">
    {#each menuItems as item}
      <li>
        <button
          class="menu-item"
          class:active={currentPage === item.id}
          on:click={() => navigateTo(item.id)}
        >
          <span class="icon">{item.icon}</span>
          <span class="label">{item.label}</span>
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .sidebar {
    width: 250px;
    height: 100vh;
    background-color: #1a1a1a;
    color: white;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border-right: 3px solid var(--primary-color);
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 2px solid var(--primary-color);
    text-align: center;
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--primary-color);
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .menu {
    list-style: none;
    padding: 1rem 0;
    margin: 0;
    flex: 1;
  }

  .menu-item {
    width: 100%;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: #999999;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    transition: all 0.3s ease;
    border-left: 2px solid transparent;
  }

  .menu-item:hover {
    background-color: #2a2a2a;
    color: var(--primary-color);
    border-left: 2px solid var(--primary-color-border);
    transform: translateX(3px);
  }

  .menu-item.active {
    background-color: #2a2a2a;
    color: var(--primary-color-border);
    border-left: 4px solid var(--primary-color-border);
    font-weight: bold;
    /* font-size: 1.05rem; */
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .icon {
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
  }

  .label {
    flex: 1;
  }
</style>
