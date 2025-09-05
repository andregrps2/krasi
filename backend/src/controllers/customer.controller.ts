import { Request, Response } from 'express';
import { CustomerService } from '../services';
import { CreateCustomerSchema, UpdateCustomerSchema, ApiResponse, AppError } from '../types';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  async getAll(req: Request, res: Response) {
    try {
      console.log('👥 [CUSTOMER CONTROLLER] getAll - Parâmetros recebidos:', req.query);
      const { storeId } = req.query;
      console.log('👥 [CUSTOMER CONTROLLER] getAll - StoreId extraído:', storeId);
      
      const customers = await this.customerService.findAll(storeId as string);
      console.log('👥 [CUSTOMER CONTROLLER] getAll - Clientes encontrados:', customers.length);
      console.log('👥 [CUSTOMER CONTROLLER] getAll - Lista de clientes:', customers);
      
      const response: ApiResponse = {
        success: true,
        data: customers
      };
      
      console.log('📤 [CUSTOMER CONTROLLER] getAll - Enviando resposta:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ [CUSTOMER CONTROLLER] getAll - Erro:', error);
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await this.customerService.findById(id);
      
      const response: ApiResponse = {
        success: true,
        data: customer
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      console.log('👥 [CUSTOMER CONTROLLER] Dados recebidos no backend:', JSON.stringify(req.body, null, 2));
      const data = CreateCustomerSchema.parse(req.body);
      console.log('✅ [CUSTOMER CONTROLLER] Dados validados pelo Zod:', data);
      
      const customer = await this.customerService.create(data);
      console.log('✅ [CUSTOMER CONTROLLER] Cliente criado:', customer);
      
      const response: ApiResponse = {
        success: true,
        data: customer,
        message: 'Cliente criado com sucesso'
      };
      
      console.log('📤 [CUSTOMER CONTROLLER] Enviando resposta:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ [CUSTOMER CONTROLLER] Erro ao criar cliente:', error);
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateCustomerSchema.parse(req.body);
      const customer = await this.customerService.update(id, data);
      
      const response: ApiResponse = {
        success: true,
        data: customer,
        message: 'Cliente atualizado com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.customerService.delete(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Cliente removido com sucesso'
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
      
      const customers = await this.customerService.search(q, storeId as string);
      
      const response: ApiResponse = {
        success: true,
        data: customers
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const balance = await this.customerService.getCustomerBalance(id);
      
      const response: ApiResponse = {
        success: true,
        data: balance
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any) {
    console.error('CustomerController Error:', error);
    
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
