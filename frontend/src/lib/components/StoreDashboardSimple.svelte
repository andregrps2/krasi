<script lang="ts">
  import type { Store } from "../../types-new";

  export let store: Store;
</script>

<div class="dashboard">
  <div class="header">
    <h1>🏪 {store.name}</h1>
    <p class="store-info">
      {#if store.address}
        📍 {store.address}
      {/if}
    </p>
  </div>

  <div class="welcome-message">
    <h2>Bem-vindo ao Painel da Loja</h2>
    <p>Use o menu lateral para navegar entre as funcionalidades:</p>

    <div class="navigation-grid">
      <div class="nav-card">
        <div class="nav-icon">🛒</div>
        <h3>Ponto de Venda</h3>
        <p>Realize vendas e gerencie transações</p>
      </div>

      <div class="nav-card">
        <div class="nav-icon">📦</div>
        <h3>Controle de Estoque</h3>
        <p>Gerencie produtos e quantidades</p>
      </div>

      <div class="nav-card">
        <div class="nav-icon">👥</div>
        <h3>Clientes</h3>
        <p>Cadastre e gerencie clientes</p>
      </div>

      <div class="nav-card">
        <div class="nav-icon">💳</div>
        <h3>Controle de Fiado</h3>
        <p>Gerencie vendas fiado e parcelas</p>
      </div>

      <div class="nav-card">
        <div class="nav-icon">📊</div>
        <h3>Relatórios</h3>
        <p>Visualize dados e estatísticas</p>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .header h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
  }

  .store-info {
    color: #666;
    font-size: 1.1rem;
  }

  .welcome-message {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .welcome-message h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
    text-align: center;
  }

  .welcome-message > p {
    text-align: center;
    margin-bottom: 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .navigation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .nav-card {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .nav-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .nav-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .nav-card h3 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  .nav-card p {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .navigation-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .nav-card {
      padding: 1rem;
    }

    .welcome-message {
      padding: 1.5rem;
    }
  }
</style>
