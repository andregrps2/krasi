import { Request, Response } from 'express';
import { InstallmentService } from '../services';
import { CreateInstallmentSchema, UpdateInstallmentSchema, PayInstallmentSchema, ApiResponse, AppError } from '../types';

export class InstallmentController {
  private installmentService: InstallmentService;

  constructor() {
    this.installmentService = new InstallmentService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const { storeId, customerId, status, overdue } = req.query;
      
      const filters = {
        storeId: storeId as string,
        customerId: customerId as string,
        status: status as string,
        overdue: overdue === 'true'
      };
      
      const installments = await this.installmentService.findAll(filters);
      
      const response: ApiResponse = {
        success: true,
        data: installments
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const installment = await this.installmentService.findById(id);
      
      const response: ApiResponse = {
        success: true,
        data: installment
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = CreateInstallmentSchema.parse(req.body);
      const installment = await this.installmentService.create(data);
      
      const response: ApiResponse = {
        success: true,
        data: installment,
        message: 'Parcela criada com sucesso'
      };
      
      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateInstallmentSchema.parse(req.body);
      const installment = await this.installmentService.update(id, data);
      
      const response: ApiResponse = {
        success: true,
        data: installment,
        message: 'Parcela atualizada com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async pay(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = PayInstallmentSchema.parse(req.body);
      const installment = await this.installmentService.pay(id, data);
      
      const response: ApiResponse = {
        success: true,
        data: installment,
        message: 'Parcela paga com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const installment = await this.installmentService.cancel(id, reason);
      
      const response: ApiResponse = {
        success: true,
        data: installment,
        message: 'Parcela cancelada com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getOverdue(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const installments = await this.installmentService.getOverdueInstallments(storeId as string);
      
      const response: ApiResponse = {
        success: true,
        data: installments
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getByCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { status } = req.query;
      
      const installments = await this.installmentService.getCustomerInstallments(customerId, status as string);
      
      const response: ApiResponse = {
        success: true,
        data: installments
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
      
      const report = await this.installmentService.getInstallmentsReport(filters);
      
      const response: ApiResponse = {
        success: true,
        data: report
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateOverdue(req: Request, res: Response) {
    try {
      const result = await this.installmentService.updateOverdueInstallments();
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Parcelas em atraso atualizadas com sucesso'
      };
      
      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any) {
    console.error('InstallmentController Error:', error);
    
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
