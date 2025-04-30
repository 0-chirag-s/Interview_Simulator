import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';


export const authenticate = (req: Request, res: Response, next: NextFunction) => {

  next();
};