import { Request, Response, NextFunction } from 'express';
import Interview, { IInterview } from '../models/Interview';
import Interviewer, { IInterviewer } from '../models/Interviewer';
import User from '../models/User';
import { AppError } from '../utils/errorHandler';
import { formatResponse } from '../utils/responseFormatter';
import { OpenAIService } from '../services/openaiService';
import { ElevenLabsService } from '../services/elevenLabsService';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mongoose from 'mongoose';

const openAIService = new OpenAIService();
const elevenLabsService = new ElevenLabsService();

export const createInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, jobPosition, interviewerId } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let interviewer;
    // If interviewer is provided, use it, otherwise generate one
    if (interviewerId) {
      interviewer = await Interviewer.findById(interviewerId);
      if (!interviewer) {
        return next(new AppError('Interviewer not found', 404));
      }
    } else {
      // Generate interviewer based on job position
      const generatedInterviewer = await openAIService.generateInterviewer(jobPosition);
      interviewer = await Interviewer.create(generatedInterviewer);
    }

    // Extract resume data if available
    let resumeData = '';
    if (user.resume) {
      try {
        const dataBuffer = fs.readFileSync(user.resume);
        if (user.resume.endsWith('.pdf')) {
          const data = await pdfParse(dataBuffer);
          resumeData = data.text;
        }
        // Add more file type handlers as needed
      } catch (error) {
        console.error('Error parsing resume:', error);
      }
    }

    // Generate interview questions
    const questions = await openAIService.generateInterviewQuestions(jobPosition, resumeData);

    // Create interview sessions with questions
    const sessions = await Promise.all(questions.map(async (questionText) => {
      let audioUrl;
      
      // Generate audio for question if interviewer has a voiceId
      if (interviewer.voiceId) {
        try {
          audioUrl = await elevenLabsService.textToSpeech(questionText, interviewer.voiceId);
        } catch (error) {
          console.error('Error generating audio for question:', error);
        }
      }
      
      return {
        question: {
          text: questionText,
          audioUrl
        },
        answer: {
          text: '',
          audioUrl: ''
        }
      };
    }));

    // Create interview
    const newInterview = await Interview.create({
      userId,
      interviewerId: interviewer._id,
      jobPosition,
      resumeData,
      sessions,
      status: 'pending'
    });

    // Use type assertion to ensure TypeScript recognizes the _id as ObjectId
    user.interviews.push(newInterview._id as any);
    await user.save();

    res.status(201).json(formatResponse(newInterview, 'Interview created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewId = req.params.interviewId;

    const interview = await Interview.findById(interviewId)
      .populate('interviewerId');

    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    res.status(200).json(formatResponse(interview));
  } catch (error) {
    next(error);
  }
};

export const startInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewId = req.params.interviewId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    if (interview.status !== 'pending') {
      return next(new AppError('Interview already started or completed', 400));
    }

    interview.status = 'in-progress';
    await interview.save();

    res.status(200).json(formatResponse(interview, 'Interview started successfully'));
  } catch (error) {
    next(error);
  }
};

export const answerQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interviewId, sessionIndex, answerText } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    if (interview.status !== 'in-progress') {
      return next(new AppError('Interview not in progress', 400));
    }

    if (sessionIndex < 0 || sessionIndex >= interview.sessions.length) {
      return next(new AppError('Invalid session index', 400));
    }

    // Update the answer text
    interview.sessions[sessionIndex].answer.text = answerText;

    // Check if audio file was uploaded
    if (req.file) {
      interview.sessions[sessionIndex].answer.audioUrl = req.file.path;
    }

    // Check if all questions are answered
    const allAnswered = interview.sessions.every(session => session.answer.text);
    if (allAnswered) {
      interview.status = 'completed';
      // Generate feedback
      interview.feedback = await openAIService.generateFeedback(interview);
    }

    await interview.save();

    res.status(200).json(formatResponse(interview.sessions[sessionIndex], 'Answer recorded successfully'));
  } catch (error) {
    next(error);
  }
};

export const completeInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interviewId = req.params.interviewId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return next(new AppError('Interview not found', 404));
    }

    if (interview.status === 'completed') {
      return next(new AppError('Interview already completed', 400));
    }

    // Generate feedback
    interview.feedback = await openAIService.generateFeedback(interview);
    interview.status = 'completed';
    await interview.save();

    res.status(200).json(formatResponse(interview, 'Interview completed successfully'));
  } catch (error) {
    next(error);
  }
};