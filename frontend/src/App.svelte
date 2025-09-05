<script lang="ts">
  import Sidebar from "./lib/Sidebar.svelte";
  import StockPage from "./lib/StockPage.svelte";
  import SalesPage from "./lib/SalesPage.svelte";
  import ReportsPage from "./lib/ReportsPage.svelte";
  import CustomersPage from "./lib/CustomersPage.svelte";
  import InstallmentsPage from "./lib/InstallmentsPage.svelte";
  import StoreSelector from "./lib/components/StoreSelector.svelte";
  import StoreDashboardSimple from "./lib/components/StoreDashboardSimple.svelte";
  import {
    currentStoreId,
    selectedStore as selectedStoreStore,
  } from "./stores";
  import type { Store } from "./types-new";

  // Estado da navegação
  let currentPage = "estoque";
  let sidebarCollapsed = false;
  let isMobile = false;
  let selectedStore: Store | null = null;

  // Detectar se é mobile
  function checkMobile() {
    isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebarCollapsed = true; // Iniciar colapsado em mobile
    }
  }

  // Verificar tamanho da tela ao carregar e redimensionar
  if (typeof window !== "undefined") {
    checkMobile();
    window.addEventListener("resize", checkMobile);
  }

  function handleNavigation(event: CustomEvent<{ page: string }>) {
    console.log("Navegando para:", event.detail.page);
    currentPage = event.detail.page;
    // Fechar sidebar automaticamente em mobile após navegação
    if (isMobile) {
      sidebarCollapsed = true;
    }
  }

  function handleToggle() {
    sidebarCollapsed = !sidebarCollapsed;
  }

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }

  function handleStoreSelect(store: Store) {
    console.log("🏪 [APP] Selecionando loja:", store);
    selectedStore = store;
    currentStoreId.set(store.id);
    selectedStoreStore.set(store); // Atualizar o store global também
    console.log("✅ [APP] Loja selecionada:", store.name, "ID:", store.id);
  }

  function handleStoreChange() {
    selectedStore = null;
    currentStoreId.set(null);
    selectedStoreStore.set(null); // Limpar o store global também
    currentPage = "estoque";
  }
</script>

<div class="app-container">
  {#if !selectedStore}
    <!-- Seleção de Loja -->
    <StoreSelector onStoreSelect={handleStoreSelect} />
  {:else}
    <!-- Overlay para mobile -->
    {#if !sidebarCollapsed && isMobile}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
      <div class="sidebar-overlay" on:click={toggleSidebar}></div>
    {/if}

    <Sidebar
      {currentPage}
      {sidebarCollapsed}
      storeName={selectedStore.name}
      on:navigate={handleNavigation}
      on:toggle={handleToggle}
      on:backToStores={handleStoreChange}
    />

    <main
      class="main-content"
      class:sidebar-collapsed={sidebarCollapsed}
      class:sales-page={currentPage === "vendas"}
    >
      <!-- Debug info -->
      <div
        style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 1000;"
      >
        Página atual: {currentPage}<br />
        Loja: {selectedStore?.name || "Nenhuma"}
      </div>

      {#if currentPage === "dashboard"}
        <StoreDashboardSimple store={selectedStore} />
      {:else if currentPage === "vendas"}
        <SalesPage />
      {:else if currentPage === "estoque"}
        <StockPage />
      {:else if currentPage === "clientes"}
        <CustomersPage />
      {:else if currentPage === "fiado"}
        <InstallmentsPage />
      {:else if currentPage === "relatorios"}
        <ReportsPage />
      {/if}
    </main>
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    min-height: 100vh; /* Mudado de height para min-height */
    background-color: #1a1a1a;
    /* Removido overflow: hidden para permitir scroll */
  }

  .main-content {
    margin-left: 250px;
    flex: 1;
    /* Removido overflow: hidden - cada página controla seu próprio scroll */
    transition: margin-left 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  /* Classe específica para o Ponto de Venda (sem scroll) */
  .main-content.sales-page {
    height: 100vh;
    overflow: hidden;
  }

  .main-content.sidebar-collapsed {
    margin-left: 60px;
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    backdrop-filter: blur(2px);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }
  }

  :global(html) {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: #1a1a1a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    --primary-color: #d4af37;
    --primary-color-transparent: rgba(212, 175, 55, 0.8);
    --primary-color-light: rgba(212, 175, 55, 0.6);
    --primary-color-border: rgba(212, 175, 55, 0.9);
  }

  :global(.card) {
    background: #2a2a2a;
    border-radius: 8px;
    box-shadow: 0 4px 8px var(--primary-color-light);
    overflow: hidden;
    border: 2px solid var(--primary-color-border);
  }

  :global(.list-card) {
    padding: 1.5rem;
  }

  :global(button) {
    background-color: var(--primary-color-transparent);
    color: #1a1a1a;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  :global(button:hover) {
    background-color: var(--text-accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px var(--primary-color-light);
  }

  :global(button.secondary) {
    background-color: transparent;
    color: var(--text-accent);
    border: 2px solid var(--primary-color-border);
  }

  :global(button.secondary:hover) {
    background-color: var(--primary-color-transparent);
    color: #1a1a1a;
  }

  :global(button.danger) {
    background-color: #dc3545;
    color: white;
  }

  :global(button.danger:hover) {
    background-color: #c82333;
  }

  :global(button.sm) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  :global(button.outline) {
    background-color: transparent;
    color: var(--text-accent);
    border: 1px solid var(--primary-color-border);
  }

  :global(button.outline:hover) {
    background-color: var(--primary-color-transparent);
    color: #1a1a1a;
  }

  :global(input, select, textarea) {
    border: 2px solid #555;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 1rem;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    background-color: #333;
    color: white;
  }

  :global(input:focus, select:focus, textarea:focus) {
    outline: none;
    border-color: var(--primary-color-border);
    box-shadow: 0 0 0 3px var(--primary-color-light);
  }

  :global(h1, h2, h3, h4, h5, h6) {
    color: var(--text-accent);
  }

  :global(table) {
    background-color: #2a2a2a;
    border: 1px solid #555;
  }

  :global(th) {
    background-color: var(--primary-color-transparent);
    color: #1a1a1a;
  }

  :global(td) {
    color: white;
    border-bottom: 1px solid #555;
  }

  :global(tr:hover) {
    background-color: #333;
  }

  :global(:root) {
    --primary-color: var(--text-accent);
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --border-color: #555;
    --text-color: #ffffff;
  }
</style>
