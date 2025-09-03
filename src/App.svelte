<script lang="ts">
  import Sidebar from "./lib/Sidebar.svelte";
  import StockPage from "./lib/StockPage.svelte";
  import SalesPage from "./lib/SalesPage.svelte";
  import ReportsPage from "./lib/ReportsPage.svelte";
  import CustomersPage from "./lib/CustomersPage.svelte";
  import InstallmentsPage from "./lib/InstallmentsPage.svelte";

  // Estado da navegação
  let currentPage = "estoque";

  function handleNavigation(event: CustomEvent<string>) {
    currentPage = event.detail;
  }
</script>

<div class="app-container">
  <Sidebar {currentPage} on:navigate={handleNavigation} />

  <main class="main-content">
    {#if currentPage === "vendas"}
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
</div>

<style>
  .app-container {
    display: flex;
    min-height: 100vh;
    background-color: #1a1a1a;
  }

  .main-content {
    margin-left: 250px;
    flex: 1;
    overflow-x: auto;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      sans-serif;
    background-color: #1a1a1a;
    color: #ffffff;
  }

  :global(.card) {
    background: #2a2a2a;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.1);
    overflow: hidden;
    border: 2px solid #ffd700;
  }

  :global(.list-card) {
    padding: 1.5rem;
  }

  :global(button) {
    background-color: #ffd700;
    color: #1a1a1a;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  :global(button:hover) {
    background-color: #ffed4e;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  }

  :global(button.secondary) {
    background-color: transparent;
    color: #ffd700;
    border: 2px solid #ffd700;
  }

  :global(button.secondary:hover) {
    background-color: #ffd700;
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
    color: #ffd700;
    border: 1px solid #ffd700;
  }

  :global(button.outline:hover) {
    background-color: #ffd700;
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
    border-color: #ffd700;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  :global(h1, h2, h3, h4, h5, h6) {
    color: #ffd700;
  }

  :global(table) {
    background-color: #2a2a2a;
    border: 1px solid #555;
  }

  :global(th) {
    background-color: #ffd700;
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
    --primary-color: #ffd700;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --border-color: #555;
    --text-color: #ffffff;
  }
</style>
