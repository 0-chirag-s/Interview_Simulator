import { Request, Response, NextFunction } from 'express';
import Interview from '../models/Interview';
import Interviewer from '../models/Interviewer';
import User from '../models/User';
import { AppError } from '../utils/errorHandler';
import { formatResponse } from '../utils/responseFormatter';
import { InterviewBotService } from '../services/interviewBotService';
import { OpenAIService } from '../services/openaiService';
import fs from 'fs';
import pdfParse from 'pdf-parse';

const interviewBotService = new InterviewBotService();
const openAIService = new OpenAIService();

/**
 * Initialize a conversational interview session
 */
export const startBotInterview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, jobPosition, voiceId } = req.body;

        // Validate user
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Generate interviewer
        const generatedInterviewer = await openAIService.generateInterviewer(jobPosition);
        const interviewer = await Interviewer.create(generatedInterviewer);

        // Extract resume data if available
        let resumeData = '';
        if (user.resume) {
            try {
                const dataBuffer = fs.readFileSync(user.resume);
                if (user.resume.endsWith('.pdf')) {
                    const data = await pdfParse(dataBuffer);
                    resumeData = data.text;
                }
            } catch (error) {
                console.error('Error parsing resume:', error);
            }
        }

        // Create the interview record first
        const newInterview = await Interview.create({
            userId,
            interviewerId: interviewer._id,
            jobPosition,
            resumeData,
            sessions: [],
            status: 'pending',
            interviewMode: 'conversational',
            currentQuestionIndex: 0
        });

        // Start the conversational interview
        const { introAudioUrl, firstQuestion } = await interviewBotService.startConversation(
            String(newInterview._id),
            voiceId || interviewer.voiceId
        );

        // Add interview to user's list
        user.interviews.push(newInterview._id as any);
        await user.save();

        // Get updated interview
        const updatedInterview = await Interview.findById(newInterview._id).populate('interviewerId');

        res.status(201).json(formatResponse({
            interview: updatedInterview,
            introAudioUrl,
            firstQuestion
        }, 'Conversational interview started successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * Submit an audio response and get the next question
 */
export const submitResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { interviewId, responseTime } = req.body;

        if (!req.file) {
            return next(new AppError('Audio file is required', 400));
        }

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return next(new AppError('Interview not found', 404));
        }

        if (interview.status !== 'in-progress') {
            return next(new AppError('Interview is not in progress', 400));
        }

        // Get interviewer for voice
        const interviewer = await Interviewer.findById(interview.interviewerId);
        const voiceId = interviewer?.voiceId;

        // Process the response
        const result = await interviewBotService.processResponse(
            interviewId,
            req.file.path,
            parseFloat(responseTime) || 0,
            voiceId
        );

        // Get updated interview
        const updatedInterview = await Interview.findById(interviewId);

        res.status(200).json(formatResponse({
            analysis: result.analysis,
            nextQuestion: result.nextQuestion,
            isComplete: result.isComplete,
            currentScore: result.currentScore,
            interview: updatedInterview
        }, result.isComplete ? 'Interview completed' : 'Response processed'));
    } catch (error) {
        next(error);
    }
};

/**
 * Handle response timeout (6 seconds with no answer)
 */
export const handleTimeout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { interviewId } = req.body;

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return next(new AppError('Interview not found', 404));
        }

        if (interview.status !== 'in-progress') {
            return next(new AppError('Interview is not in progress', 400));
        }

        // Get interviewer for voice
        const interviewer = await Interviewer.findById(interview.interviewerId);
        const voiceId = interviewer?.voiceId;

        // Handle the timeout
        const result = await interviewBotService.handleTimeout(interviewId, voiceId);

        // Get updated interview
        const updatedInterview = await Interview.findById(interviewId);

        res.status(200).json(formatResponse({
            nextQuestion: result.nextQuestion,
            isComplete: result.isComplete,
            message: result.message,
            interview: updatedInterview
        }, 'Timeout handled'));
    } catch (error) {
        next(error);
    }
};

/**
 * Get current interview status
 */
export const getInterviewStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { interviewId } = req.params;

        const interview = await Interview.findById(interviewId)
            .populate('interviewerId');

        if (!interview) {
            return next(new AppError('Interview not found', 404));
        }

        const currentSession = interview.sessions[interview.currentQuestionIndex];

        res.status(200).json(formatResponse({
            interview,
            currentQuestion: currentSession?.question,
            questionNumber: interview.currentQuestionIndex + 1,
            totalAnswered: interview.sessions.filter(s => s.answer.text).length,
            currentScore: interview.totalScore
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * Manually complete the interview early
 */
export const completeEarly = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { interviewId } = req.params;

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return next(new AppError('Interview not found', 404));
        }

        if (interview.status === 'completed') {
            return next(new AppError('Interview already completed', 400));
        }

        // Generate final feedback
        interview.feedback = await openAIService.generateFeedback(interview);
        interview.status = 'completed';

        // Calculate final scores
        const answeredSessions = interview.sessions.filter(s => s.answer.text && !s.wasSkipped);
        if (answeredSessions.length > 0) {
            const totals = answeredSessions.reduce((acc, session) => ({
                technical: acc.technical + (session.score?.technical || 0),
                communication: acc.communication + (session.score?.communication || 0),
                confidence: acc.confidence + (session.score?.confidence || 0)
            }), { technical: 0, communication: 0, confidence: 0 });

            interview.totalScore = {
                technical: Math.round(totals.technical / answeredSessions.length),
                communication: Math.round(totals.communication / answeredSessions.length),
                confidence: Math.round(totals.confidence / answeredSessions.length),
                overall: 0
            };
            interview.totalScore.overall = Math.round(
                (interview.totalScore.technical * 0.4) +
                (interview.totalScore.communication * 0.3) +
                (interview.totalScore.confidence * 0.3)
            );
        }

        await interview.save();

        res.status(200).json(formatResponse(interview, 'Interview completed successfully'));
    } catch (error) {
        next(error);
    }
};
