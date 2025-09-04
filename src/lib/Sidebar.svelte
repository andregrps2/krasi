<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let currentPage: string = "estoque";
  export let sidebarCollapsed: boolean = false;

  const dispatch = createEventDispatcher();

  function navigateTo(page: string) {
    dispatch("navigate", page);
  }

  function toggleSidebar() {
    dispatch("toggle");
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

<nav class="sidebar" class:collapsed={sidebarCollapsed}>
  <div class="sidebar-header">
    <button
      class="menu-toggle"
      on:click={toggleSidebar}
      title={sidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
      aria-label={sidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
    >
      <svg
        class="menu-icon"
        class:collapsed={sidebarCollapsed}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          class="line top"
          d="M3 12h18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          class="line middle"
          d="M3 6h18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          class="line bottom"
          d="M3 18h18"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    {#if !sidebarCollapsed}
      <h2>Ricardo Ternos</h2>
    {/if}
  </div>

  <ul class="menu">
    {#each menuItems as item}
      <li>
        <button
          class="menu-item"
          class:active={currentPage === item.id}
          on:click={() => navigateTo(item.id)}
          title={sidebarCollapsed ? item.label : ""}
        >
          <span class="icon">{item.icon}</span>
          {#if !sidebarCollapsed}
            <span class="label">{item.label}</span>
          {/if}
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
    transition: width 0.3s ease;
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: 60px;
  }

  .sidebar-header {
    padding: var(--spacing-lg);
    border-bottom: 2px solid var(--border-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background: linear-gradient(
      135deg,
      var(--color-gold-transparent),
      rgba(0, 0, 0, 0.1)
    );
    backdrop-filter: blur(10px);
    min-height: 64px;
  }

  .menu-toggle {
    background: none;
    border: none;
    color: var(--text-accent);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .menu-toggle:hover {
    background: rgba(212, 175, 55, 0.1);
    color: var(--text-primary);
  }

  .menu-toggle:active {
    background: rgba(212, 175, 55, 0.2);
    transform: scale(0.95);
  }

  .menu-icon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .menu-icon .line {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .menu-icon.collapsed .line.top {
    transform: rotate(45deg) translate(0, 6px);
  }

  .menu-icon.collapsed .line.middle {
    opacity: 0;
    transform: scaleX(0);
  }

  .menu-icon.collapsed .line.bottom {
    transform: rotate(-45deg) translate(0, -6px);
  }

  .sidebar-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(
      45deg,
      var(--accent-primary),
      var(--accent-secondary)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
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

  .collapsed .menu-item {
    justify-content: center;
    padding: var(--spacing-lg);
  }

  .collapsed .menu-item .label {
    display: none;
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

  /* Media queries para responsividade */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      transition:
        transform 0.3s ease,
        width 0.3s ease;
      z-index: 1100;
    }

    .sidebar:not(.collapsed) {
      transform: translateX(0);
      width: 250px;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
    }

    .sidebar.collapsed {
      transform: translateX(-100%);
      width: 60px;
    }
  }

  @media (max-width: 480px) {
    .sidebar:not(.collapsed) {
      width: 280px;
    }

    .menu-item {
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .collapsed .menu-item {
      padding: var(--spacing-md);
    }

    .sidebar-header {
      padding: var(--spacing-md);
      min-height: 56px;
    }

    .menu-toggle {
      width: 36px;
      height: 36px;
      padding: 6px;
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
    }
  }
</style>
