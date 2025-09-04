import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Ricardo Estoque Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@ricardoestoque.com',
      phone: '(11) 99999-9999',
      address: 'Rua do Comércio, 123 - São Paulo, SP'
    }
  });

  console.log('✅ Empresa criada:', company.name);

  // Create stores
  const loja1 = await prisma.store.create({
    data: {
      name: 'Loja Centro',
      address: 'Rua do Centro, 456 - São Paulo, SP',
      phone: '(11) 88888-8888',
      email: 'centro@ricardoestoque.com',
      companyId: company.id
    }
  });

  const loja2 = await prisma.store.create({
    data: {
      name: 'Loja Shopping',
      address: 'Shopping Center, Loja 789 - São Paulo, SP', 
      phone: '(11) 77777-7777',
      email: 'shopping@ricardoestoque.com',
      companyId: company.id
    }
  });

  console.log('✅ Lojas criadas:', loja1.name, 'e', loja2.name);

  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@ricardoestoque.com',
      password: 'senha123', // In production, hash this
      role: 'MANAGER',
      storeId: loja1.id
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@ricardoestoque.com',
      password: 'senha123', // In production, hash this
      role: 'CASHIER',
      storeId: loja2.id
    }
  });

  console.log('✅ Usuários criados:', user1.name, 'e', user2.name);

  // Create products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Notebook Dell Inspiron',
        description: 'Notebook Dell Inspiron 15 3000, Intel Core i3, 4GB RAM, 1TB HD',
        brand: 'Dell',
        category: 'Informática',
        barcode: '7891234567890',
        unit: 'un'
      },
      {
        name: 'Mouse Wireless Logitech',
        description: 'Mouse sem fio Logitech M170, sensor óptico, alcance 10m',
        brand: 'Logitech',
        category: 'Informática',
        barcode: '7891234567891',
        unit: 'un'
      },
      {
        name: 'Teclado Mecânico Gamer',
        description: 'Teclado mecânico RGB, switches blue, ABNT2',
        brand: 'Redragon',
        category: 'Informática',
        barcode: '7891234567892',
        unit: 'un'
      },
      {
        name: 'Monitor LED 24"',
        description: 'Monitor LED 24 polegadas, Full HD, HDMI/VGA',
        brand: 'LG',
        category: 'Informática',
        barcode: '7891234567893',
        unit: 'un'
      },
      {
        name: 'Cabo HDMI 2m',
        description: 'Cabo HDMI 2.0, 2 metros, 4K Ultra HD',
        brand: 'Multilaser',
        category: 'Cabos e Adaptadores',
        barcode: '7891234567894',
        unit: 'un'
      }
    ]
  });

  console.log('✅ Produtos criados:', products.count, 'produtos');

  // Get created products
  const createdProducts = await prisma.product.findMany();

  // Create stock items for both stores
  for (const product of createdProducts) {
    // Stock for store 1
    await prisma.stockItem.create({
      data: {
        productId: product.id,
        storeId: loja1.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        minQuantity: 5,
        maxQuantity: 100,
        purchasePrice: Math.floor(Math.random() * 500) + 50,
        salePrice: Math.floor(Math.random() * 800) + 100
      }
    });

    // Stock for store 2
    await prisma.stockItem.create({
      data: {
        productId: product.id,
        storeId: loja2.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        minQuantity: 5,
        maxQuantity: 100,
        purchasePrice: Math.floor(Math.random() * 500) + 50,
        salePrice: Math.floor(Math.random() * 800) + 100
      }
    });
  }

  console.log('✅ Estoque criado para ambas as lojas');

  // Create customers
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: 'Carlos Oliveira',
        cpf: '123.456.789-00',
        phone: '(11) 91234-5678',
        email: 'carlos@email.com',
        address: 'Rua A, 123 - São Paulo, SP',
        storeId: loja1.id
      },
      {
        name: 'Ana Costa',
        cpf: '987.654.321-00',
        phone: '(11) 98765-4321',
        email: 'ana@email.com',
        address: 'Rua B, 456 - São Paulo, SP',
        storeId: loja1.id
      },
      {
        name: 'Pedro Silva',
        cpf: '456.789.123-00',
        phone: '(11) 95555-5555',
        email: 'pedro@email.com',
        address: 'Rua C, 789 - São Paulo, SP',
        storeId: loja2.id
      }
    ]
  });

  console.log('✅ Clientes criados:', customers.count, 'clientes');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
