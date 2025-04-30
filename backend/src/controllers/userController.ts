import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { AppError } from '../utils/errorHandler';
import { formatResponse } from '../utils/responseFormatter';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }
    
    const newUser = await User.create({
      name,
      email,
      password,
     
    });
    
    res.status(201).json(formatResponse(newUser, 'User created successfully'));
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Store resume file path
    user.resume = req.file.path;
    await user.save();
    
    // Extract text from PDF resume for later use
    let resumeText = '';
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      resumeText = data.text;
    }
    
    res.status(200).json(formatResponse({
      resumePath: req.file.path,
      resumeText
    }, 'Resume uploaded successfully'));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    res.status(200).json(formatResponse(user));
  } catch (error) {
    next(error);
  }
};
