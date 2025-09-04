import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar uma empresa
  const company = await prisma.company.create({
    data: {
      name: 'Ricardo Ternos',
      cnpj: '12.345.678/0001-90',
      email: 'contato@ricardoternos.com',
      phone: '(11) 99999-9999',
      address: 'Rua dos Ternos, 123 - Centro',
    },
  });

  console.log('✅ Empresa criada:', company.name);

  // Criar lojas
  const lojas = [
    {
      name: 'Loja Centro',
      address: 'Rua Principal, 123 - Centro',
      phone: '(11) 91111-1111',
      email: 'centro@ricardoternos.com',
      companyId: company.id,
    },
    {
      name: 'Loja Shopping',
      address: 'Shopping Center, Loja 45 - Zona Sul',
      phone: '(11) 92222-2222',
      email: 'shopping@ricardoternos.com',
      companyId: company.id,
    },
    {
      name: 'Loja Zona Norte',
      address: 'Av. Norte, 456 - Zona Norte',
      phone: '(11) 93333-3333',
      email: 'norte@ricardoternos.com',
      companyId: company.id,
    },
  ];

  for (const loja of lojas) {
    const novaLoja = await prisma.store.create({
      data: loja,
    });
    console.log('🏪 Loja criada:', novaLoja.name);
  }

  // Criar alguns produtos
  const produtos = [
    {
      name: 'Terno Slim Azul Marinho',
      description: 'Terno slim fit em tecido premium',
      brand: 'Ricardo Ternos',
      category: 'Ternos',
      barcode: '7891234567890',
      unit: 'un',
    },
    {
      name: 'Camisa Social Branca',
      description: 'Camisa social algodão egípcio',
      brand: 'Ricardo Ternos',
      category: 'Camisas',
      barcode: '7891234567891',
      unit: 'un',
    },
    {
      name: 'Gravata Seda Vermelha',
      description: 'Gravata em seda pura importada',
      brand: 'Ricardo Ternos',
      category: 'Acessórios',
      barcode: '7891234567892',
      unit: 'un',
    },
  ];

  for (const produto of produtos) {
    const novoProduto = await prisma.product.create({
      data: produto,
    });
    console.log('📦 Produto criado:', novoProduto.name);

    // Criar estoque para cada loja
    const stores = await prisma.store.findMany();
    for (const store of stores) {
      await prisma.stockItem.create({
        data: {
          quantity: Math.floor(Math.random() * 50) + 10, // Entre 10 e 60
          minQuantity: 5,
          maxQuantity: 100,
          purchasePrice: Math.floor(Math.random() * 200) + 50, // Entre 50 e 250
          salePrice: Math.floor(Math.random() * 400) + 100, // Entre 100 e 500
          productId: novoProduto.id,
          storeId: store.id,
        },
      });
    }
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
