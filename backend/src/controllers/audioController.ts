import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { formatResponse } from '../utils/responseFormatter';
import { ElevenLabsService } from '../services/elevenLabsService';
import { DeepgramService } from '../services/deepgramService';
import path from 'path';

const elevenLabsService = new ElevenLabsService();
const deepgramService = new DeepgramService();

export const textToSpeech = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text) {
      return next(new AppError('Text is required', 400));
    }
    

    console.log('Text to speech request:', { 
      textLength: text.length,
      voiceId: voiceId || 'Not provided (will use default)'
    });
    
 
    const filePath = await elevenLabsService.textToSpeech(text, voiceId);
    
 
    const fileName = path.basename(filePath);
    
   
    const audioPath = `/audio/${fileName}`;
    
    console.log('Audio generated successfully. File path:', filePath);
    console.log('Public URL path:', audioPath);
    
    res.status(200).json(formatResponse({ audioPath }, 'Text converted to speech successfully'));
  } catch (error) {
    next(error);
  }
};

export const speechToText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('Audio file is required', 400));
    }
    
    const transcript = await deepgramService.speechToText(req.file.path);
    
    res.status(200).json(formatResponse({ transcript }, 'Speech converted to text successfully'));
  } catch (error) {
    next(error);
  }
};

export const getVoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voices = await elevenLabsService.getAvailableVoices();
    
    res.status(200).json(formatResponse({ 
      voices,
      count: voices.length 
    }, 'Retrieved available voices successfully'));
  } catch (error) {
    next(error);
  }
};