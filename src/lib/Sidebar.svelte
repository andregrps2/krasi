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
    background: linear-gradient(
      180deg,
      var(--bg-primary) 0%,
      var(--bg-secondary) 100%
    );
    color: var(--text-primary);
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border-right: 3px solid var(--border-primary);
    box-shadow: var(--shadow-large);
  }

  .sidebar-header {
    padding: var(--spacing-xl) var(--spacing-lg);
    border-bottom: 2px solid var(--border-primary);
    text-align: center;
    background: linear-gradient(
      135deg,
      var(--color-gold-transparent),
      rgba(0, 0, 0, 0.1)
    );
    backdrop-filter: blur(10px);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--text-accent);
    font-weight: 700;
    text-shadow: var(--shadow-small);
    letter-spacing: 0.5px;
    background: linear-gradient(
      45deg,
      var(--color-gold),
      var(--color-gold-light)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .menu {
    list-style: none;
    padding: var(--spacing-lg) 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
  }

  .menu-item {
    width: 100%;
    padding: var(--spacing-lg) var(--spacing-xl);
    background: none;
    border: none;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: 1.1rem;
    font-weight: 500;
    transition: all var(--transition-normal);
    border-left: 3px solid transparent;
    position: relative;
    margin: var(--spacing-xs) 0;
  }

  .menu-item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(
      90deg,
      var(--color-gold),
      var(--color-gold-light)
    );
    transition: width var(--transition-normal);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .menu-item:hover {
    background: linear-gradient(
      90deg,
      var(--color-gold-transparent),
      transparent
    );
    color: var(--text-accent);
    transform: translateX(6px);
    border-left: 3px solid var(--border-primary);
  }

  .menu-item:hover::before {
    width: 4px;
  }

  .menu-item.active {
    background: linear-gradient(
      90deg,
      rgba(184, 134, 11, 0.25),
      rgba(184, 134, 11, 0.1)
    );
    color: var(--text-accent);
    border-left: 3px solid var(--border-primary);
    font-weight: 700;
    transform: translateX(8px);
    box-shadow: var(--shadow-gold);
  }

  .menu-item.active::before {
    width: 6px;
    background: linear-gradient(
      180deg,
      var(--color-gold),
      var(--color-gold-light)
    );
  }

  .icon {
    font-size: 1.4rem;
    width: 28px;
    text-align: center;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .label {
    flex: 1;
    font-weight: inherit;
  }

  /* Scroll personalizado */
  .menu::-webkit-scrollbar {
    width: 4px;
  }

  .menu::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  .menu::-webkit-scrollbar-thumb {
    background: var(--color-gold-transparent);
    border-radius: var(--radius-full);
  }

  .menu::-webkit-scrollbar-thumb:hover {
    background: var(--border-primary);
  }
</style>
