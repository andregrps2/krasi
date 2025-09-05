import { Request, Response } from 'express';
import { StockService } from '../services';
import { CreateStockItemSchema, UpdateStockItemSchema, ApiResponse, AppError } from '../types';

export class StockController {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const stockItems = await this.stockService.findAll(storeId as string);
      
      const response: ApiResponse = {
        success: true,
        data: stockItems
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stockItem = await this.stockService.findById(id);
      
      const response: ApiResponse = {
        success: true,
        data: stockItem
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getByProductAndStore(req: Request, res: Response) {
    try {
      const { productId, storeId } = req.params;
      const stockItem = await this.stockService.findByProductAndStore(productId, storeId);
      
      if (!stockItem) {
        return res.status(404).json({
          success: false,
          error: 'Item de estoque não encontrado'
        });
      }
      
      const response: ApiResponse = {
        success: true,
        data: stockItem
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = CreateStockItemSchema.parse(req.body);
      const stockItem = await this.stockService.create(data);
      
      const response: ApiResponse = {
        success: true,
        data: stockItem,
        message: 'Item de estoque criado com sucesso'
      };
      
      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateStockItemSchema.parse(req.body);
      const stockItem = await this.stockService.update(id, data);
      
      const response: ApiResponse = {
        success: true,
        data: stockItem,
        message: 'Item de estoque atualizado com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, operation = 'set' } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade deve ser um número positivo'
        });
      }
      
      if (!['add', 'subtract', 'set'].includes(operation)) {
        return res.status(400).json({
          success: false,
          error: 'Operação deve ser: add, subtract ou set'
        });
      }
      
      const stockItem = await this.stockService.updateQuantity(id, quantity, operation);
      
      const response: ApiResponse = {
        success: true,
        data: stockItem,
        message: 'Quantidade atualizada com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.stockService.delete(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Item de estoque removido com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q, storeId } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro de busca é obrigatório'
        });
      }
      
      const stockItems = await this.stockService.search(q, storeId as string);
      
      const response: ApiResponse = {
        success: true,
        data: stockItems
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const lowStockItems = await this.stockService.getLowStockItems(storeId as string);
      
      const response: ApiResponse = {
        success: true,
        data: lowStockItems
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const report = await this.stockService.getStockReport(storeId as string);
      
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
    console.error('StockController Error:', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
