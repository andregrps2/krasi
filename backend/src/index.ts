import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Routes imports
import productRoutes from './routes/products';
import storeRoutes from './routes/stores';
import customerRoutes from './routes/customers';
import saleRoutes from './routes/sales';
import stockRoutes from './routes/stock';
import installmentRoutes from './routes/installments';
import companyRoutes from './routes/companies';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/companies', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/installments', installmentRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nDesconectando do banco de dados...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
});

export { prisma };
