import { Request, Response } from 'express';
import { ProductService } from '../services';
import { CreateProductSchema, UpdateProductSchema, ApiResponse, AppError } from '../types';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const products = await this.productService.findAll();
      
      const response: ApiResponse = {
        success: true,
        data: products
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await this.productService.findById(id);
      
      const response: ApiResponse = {
        success: true,
        data: product
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getByBarcode(req: Request, res: Response) {
    try {
      const { barcode } = req.params;
      const product = await this.productService.findByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Produto não encontrado'
        });
      }
      
      const response: ApiResponse = {
        success: true,
        data: product
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      console.log('📦 [PRODUCT] Dados recebidos no backend:', JSON.stringify(req.body, null, 2));
      const data = CreateProductSchema.parse(req.body);
      const product = await this.productService.create(data);
      
      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Produto criado com sucesso'
      };
      
      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateProductSchema.parse(req.body);
      const product = await this.productService.update(id, data);
      
      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Produto atualizado com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.productService.delete(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Produto removido com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro de busca é obrigatório'
        });
      }
      
      const products = await this.productService.search(q);
      
      const response: ApiResponse = {
        success: true,
        data: products
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any) {
    console.error('ProductController Error:', error);
    
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
