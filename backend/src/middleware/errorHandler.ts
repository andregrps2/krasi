import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error Handler:', error);

  // Se é um erro operacional conhecido
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Erro de validação do Zod
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

  // Erro do Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Já existe um registro com esses dados únicos'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado'
    });
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON malformado'
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
