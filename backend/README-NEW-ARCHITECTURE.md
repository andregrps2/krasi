# Sistema de Estoque - Nova Arquitetura

## Estrutura Reestruturada

O backend foi completamente reestruturado para ter uma arquitetura mais limpa e organizada:

```
backend/src/
├── controllers/          # Controllers para cada entidade
│   ├── product.controller.ts
│   ├── customer.controller.ts
│   ├── stock.controller.ts
│   ├── sale.controller.ts
│   ├── installment.controller.ts
│   └── index.ts
├── services/             # Services para lógica de negócio
│   ├── product.service.ts
│   ├── customer.service.ts
│   ├── stock.service.ts
│   ├── sale.service.ts
│   ├── installment.service.ts
│   ├── prisma.service.ts
│   └── index.ts
├── types/                # Types e schemas de validação
│   └── index.ts
├── middleware/           # Middlewares
│   └── errorHandler.ts
└── routes/               # Rotas HTTP
    ├── products-new.ts
    ├── customers-new.ts
    ├── stock-new.ts
    ├── sales-new.ts
    └── installments-new.ts
```

## Melhorias Implementadas

### 1. **Arquitetura em Camadas**

- **Controllers**: Lidam com requisições HTTP e validação de entrada
- **Services**: Contêm a lógica de negócio e interação com o banco
- **Types**: Centralizam validações com Zod e tipos TypeScript

### 2. **Tratamento de Erros Melhorado**

- Classe `AppError` para erros operacionais
- Middleware centralizado de tratamento de erros
- Validação robusta com Zod
- Logs detalhados para debugging

### 3. **Validações Aprimoradas**

- Schemas Zod para todas as entidades
- Validação de dados de entrada
- Verificação de integridade referencial
- Prevenção de duplicatas

### 4. **Transações Seguras**

- Todas as operações críticas em transações
- Rollback automático em caso de erro
- Logs detalhados do processo

## Principais Correções de Bugs

### 1. **Venda no Fiado (PDV)**

- ✅ Validação obrigatória de cliente para vendas FIADO
- ✅ Verificação de estoque antes da venda
- ✅ Criação automática de parcelas
- ✅ Transações seguras com rollback

### 2. **Controle de Fiado**

- ✅ Sistema de parcelas robusto
- ✅ Cálculo correto de valores em atraso
- ✅ Pagamento de parcelas com validação
- ✅ Relatórios de parcelas pendentes

### 3. **Gestão de Estoque**

- ✅ Atualização atômica de quantidades
- ✅ Verificação de estoque disponível
- ✅ Reversão automática em cancelamentos
- ✅ Logs de todas as movimentações

## Como Testar

### 1. Iniciar o Servidor

```bash
cd backend
npm run dev
```

### 2. Endpoints Principais

#### Produtos

- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/search?q=termo` - Buscar produtos

#### Clientes

- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Criar cliente
- `GET /api/customers/:id/balance` - Saldo do cliente

#### Vendas

- `POST /api/sales` - Criar venda
- `GET /api/sales` - Listar vendas
- `PATCH /api/sales/:id/cancel` - Cancelar venda

#### Parcelas

- `GET /api/installments` - Listar parcelas
- `PATCH /api/installments/:id/pay` - Pagar parcela
- `GET /api/installments/overdue` - Parcelas em atraso

### 3. Exemplo de Venda no Fiado

```json
POST /api/sales
{
  "storeId": "store_id",
  "customerId": "customer_id",
  "total": 100.00,
  "paymentType": "FIADO",
  "items": [
    {
      "productId": "product_id",
      "stockItemId": "stock_item_id",
      "quantity": 2,
      "price": 50.00,
      "total": 100.00
    }
  ],
  "installments": [
    {
      "number": 1,
      "amount": 100.00,
      "dueDate": "2025-10-05",
      "isPaid": false
    }
  ]
}
```

### 4. Exemplo de Pagamento de Parcela

```json
PATCH /api/installments/:id/pay
{
  "paymentType": "CASH",
  "notes": "Pagamento em dinheiro"
}
```

## Compatibilidade

As rotas antigas ainda funcionam, mas recomenda-se migrar para as novas:

- `/api/products` → Nova arquitetura
- `/api/customers` → Nova arquitetura
- `/api/sales` → Nova arquitetura
- `/api/stock` → Nova arquitetura
- `/api/installments` → Nova arquitetura

## Logs e Debugging

O sistema agora possui logs detalhados:

- 🔄 Início de operações
- 💾 Salvamento de dados
- ✅ Sucessos
- ❌ Erros com stack trace
- 📦 Processamento de itens
- 💳 Processamento de parcelas

## Próximos Passos

1. Testar todos os endpoints
2. Atualizar frontend para usar nova API
3. Remover rotas antigas após validação
4. Implementar autenticação/autorização
5. Adicionar cache Redis (opcional)
6. Implementar webhooks (opcional)
