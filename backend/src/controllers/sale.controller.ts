import { Request, Response } from 'express';
import { SaleService } from '../services';
import { CreateSaleSchema, ApiResponse, AppError } from '../types';

export class SaleController {
  private saleService: SaleService;

  constructor() {
    this.saleService = new SaleService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const { storeId, customerId, paymentType, status, startDate, endDate } = req.query;
      
      const filters = {
        storeId: storeId as string,
        customerId: customerId as string,
        paymentType: paymentType as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string
      };
      
      const sales = await this.saleService.findAll(filters);
      
      const response: ApiResponse = {
        success: true,
        data: sales
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sale = await this.saleService.findById(id);
      
      const response: ApiResponse = {
        success: true,
        data: sale
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      console.log('📥 [SaleController] Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      // Validar dados de entrada
      const data = CreateSaleSchema.parse(req.body);
      console.log('✅ [SaleController] Validação do schema passou');
      
      // Criar venda
      const sale = await this.saleService.create(data);
      console.log('✅ [SaleController] Venda criada com sucesso:', sale.id);
      
      const response: ApiResponse = {
        success: true,
        data: sale,
        message: 'Venda realizada com sucesso'
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ [SaleController] Erro ao criar venda:', error);
      this.handleError(res, error);
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const sale = await this.saleService.cancel(id, reason);
      
      const response: ApiResponse = {
        success: true,
        data: sale,
        message: 'Venda cancelada com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const { storeId, startDate, endDate } = req.query;
      
      const filters = {
        storeId: storeId as string,
        startDate: startDate as string,
        endDate: endDate as string
      };
      
      const report = await this.saleService.getSalesReport(filters);
      
      const response: ApiResponse = {
        success: true,
        data: report
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any) {
    console.error('SaleController Error:', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
