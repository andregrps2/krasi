import express from 'express';
import cors from 'cors';
import { prisma, PrismaService } from './services/prisma.service';

// Routes imports - OLD
import productRoutes from './routes/products';
import storeRoutes from './routes/stores';
import customerRoutes from './routes/customers';
import saleRoutes from './routes/sales';
import stockRoutes from './routes/stock';
import installmentRoutes from './routes/installments';
import companyRoutes from './routes/companies';

// Routes imports - NEW
import productRoutesNew from './routes/products-new';
import customerRoutesNew from './routes/customers-new';
import stockRoutesNew from './routes/stock-new';
import saleRoutesNew from './routes/sales-new';
import installmentRoutesNew from './routes/installments-new';

const app = express();
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

// API Routes - OLD (mantidas para compatibilidade)
app.use('/api/companies', companyRoutes);
app.use('/api/stores', storeRoutes);

// API Routes - NEW (arquitetura limpa)
app.use('/api/products', productRoutesNew);
app.use('/api/customers', customerRoutesNew);
app.use('/api/sales', saleRoutesNew);
app.use('/api/stock', stockRoutesNew);
app.use('/api/installments', installmentRoutesNew);

// API Routes - OLD (fallback para rotas não migradas)
// app.use('/api/products-old', productRoutes);
// app.use('/api/customers-old', customerRoutes);
// app.use('/api/sales-old', saleRoutes);
// app.use('/api/stock-old', stockRoutes);
// app.use('/api/installments-old', installmentRoutes);

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
  await PrismaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Recebido SIGTERM. Desconectando do banco de dados...');
  await PrismaService.disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
});

// Export prisma for backwards compatibility
export { prisma };
