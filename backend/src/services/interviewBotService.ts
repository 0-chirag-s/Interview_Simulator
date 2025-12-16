import { OpenAIService } from './openaiService';
import { DeepgramService } from './deepgramService';
import { ElevenLabsService } from './elevenLabsService';
import Interview, { IInterview, IInterviewSession } from '../models/Interview';
import { AppError } from '../utils/errorHandler';

interface AnswerAnalysis {
    transcript: string;
    confidence: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    keywords: string[];
    fillerWordCount: number;
    responseTime: number;
}

interface NextQuestionDecision {
    action: 'increase_difficulty' | 'decrease_difficulty' | 'switch_domain' | 'continue' | 'complete';
    reason: string;
    suggestedDomain?: string;
}

interface BotResponse {
    questionText: string;
    audioUrl: string;
    questionNumber: number;
    totalQuestions: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface FinalReport {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    strengths: string[];
    areasForImprovement: string[];
    recommendation: string;
    detailedFeedback: string;
}

export class InterviewBotService {
    private openAIService: OpenAIService;
    private deepgramService: DeepgramService;
    private elevenLabsService: ElevenLabsService;

    // Bot introduction script
    private readonly introScript = `Hello and welcome to your interview session. 
    I'll be conducting your technical interview today. 
    This interview will assess your technical knowledge, problem-solving skills, and communication abilities.
    Please speak clearly and take your time to think before answering each question.
    If you don't respond within 6 seconds, I'll move on to the next question.
    Let's begin!`;

    constructor() {
        this.openAIService = new OpenAIService();
        this.deepgramService = new DeepgramService();
        this.elevenLabsService = new ElevenLabsService();
    }

    /**
     * Start a conversational interview session
     */
    async startConversation(interviewId: string, voiceId?: string): Promise<{
        introAudioUrl: string;
        firstQuestion: BotResponse;
    }> {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }

        // Generate intro audio
        const introAudioUrl = await this.elevenLabsService.textToSpeech(this.introScript, voiceId);

        // Generate first questions based on resume (1-2 starter questions)
        const starterQuestions = await this.openAIService.generateInitialQuestionsFromResume(
            interview.jobPosition,
            interview.resumeData || '',
            2
        );

        if (starterQuestions.length === 0) {
            throw new AppError('Failed to generate initial questions', 500);
        }

        const firstQuestionText = starterQuestions[0];
        const firstQuestionAudio = await this.elevenLabsService.textToSpeech(firstQuestionText, voiceId);

        // Initialize session with first question
        interview.sessions = [{
            question: {
                text: firstQuestionText,
                audioUrl: firstQuestionAudio
            },
            answer: {
                text: '',
                audioUrl: ''
            },
            difficulty: 'easy',
            responseTime: 0,
            wasSkipped: false,
            score: {
                technical: 0,
                communication: 0,
                confidence: 0,
                keywords: [],
                fillerWords: 0
            }
        }];

        // Store remaining starter questions for later
        interview.pendingQuestions = starterQuestions.slice(1);
        interview.interviewMode = 'conversational';
        interview.currentQuestionIndex = 0;
        interview.status = 'in-progress';
        await interview.save();

        return {
            introAudioUrl,
            firstQuestion: {
                questionText: firstQuestionText,
                audioUrl: firstQuestionAudio,
                questionNumber: 1,
                totalQuestions: 5, // Dynamic based on performance
                difficulty: 'easy'
            }
        };
    }

    /**
     * Process a candidate's audio response
     */
    async processResponse(
        interviewId: string,
        audioFilePath: string,
        responseTime: number,
        voiceId?: string
    ): Promise<{
        analysis: AnswerAnalysis;
        nextQuestion: BotResponse | null;
        isComplete: boolean;
        currentScore: { technical: number; communication: number; confidence: number };
    }> {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }

        const currentIndex = interview.currentQuestionIndex || 0;
        const currentSession = interview.sessions[currentIndex];

        // Convert speech to text and analyze
        const transcript = await this.deepgramService.speechToText(audioFilePath);

        // Get NLP analysis from OpenAI
        const nlpAnalysis = await this.openAIService.analyzeAnswer(
            currentSession.question.text,
            transcript,
            interview.jobPosition
        );

        // Update session with answer and scores
        currentSession.answer.text = transcript;
        currentSession.answer.audioUrl = audioFilePath;
        currentSession.responseTime = responseTime;
        currentSession.score = {
            technical: nlpAnalysis.technicalScore,
            communication: nlpAnalysis.communicationScore,
            confidence: nlpAnalysis.confidenceScore,
            keywords: nlpAnalysis.keywords,
            fillerWords: nlpAnalysis.fillerWordCount
        };

        // Determine next action
        const decision = await this.determineNextQuestion(interview, nlpAnalysis);

        let nextQuestion: BotResponse | null = null;
        let isComplete = false;

        if (decision.action === 'complete' || currentIndex >= 4) {
            // Interview complete (max 5 questions)
            isComplete = true;
            interview.status = 'completed';

            // Generate final feedback
            interview.feedback = await this.generateFinalReport(interview);
        } else {
            // Generate next question
            const previousQA = interview.sessions.map(s => ({
                question: s.question.text,
                answer: s.answer.text,
                score: s.score
            }));

            const nextDifficulty = this.getNextDifficulty(decision, currentSession.difficulty);

            const nextQuestionText = await this.openAIService.generateFollowUpQuestion(
                interview.jobPosition,
                interview.resumeData || '',
                previousQA,
                nextDifficulty,
                decision.suggestedDomain
            );

            const nextQuestionAudio = await this.elevenLabsService.textToSpeech(nextQuestionText, voiceId);

            // Add new session
            interview.sessions.push({
                question: {
                    text: nextQuestionText,
                    audioUrl: nextQuestionAudio
                },
                answer: { text: '', audioUrl: '' },
                difficulty: nextDifficulty,
                responseTime: 0,
                wasSkipped: false,
                score: {
                    technical: 0,
                    communication: 0,
                    confidence: 0,
                    keywords: [],
                    fillerWords: 0
                }
            });

            interview.currentQuestionIndex = currentIndex + 1;

            nextQuestion = {
                questionText: nextQuestionText,
                audioUrl: nextQuestionAudio,
                questionNumber: currentIndex + 2,
                totalQuestions: 5,
                difficulty: nextDifficulty
            };
        }

        // Calculate running scores
        const currentScore = this.calculateCurrentScores(interview);
        interview.totalScore = {
            ...currentScore,
            overall: (currentScore.technical * 0.4) + (currentScore.communication * 0.3) + (currentScore.confidence * 0.3)
        };

        await interview.save();

        return {
            analysis: {
                transcript,
                confidence: nlpAnalysis.confidenceScore,
                technicalScore: nlpAnalysis.technicalScore,
                communicationScore: nlpAnalysis.communicationScore,
                confidenceScore: nlpAnalysis.confidenceScore,
                keywords: nlpAnalysis.keywords,
                fillerWordCount: nlpAnalysis.fillerWordCount,
                responseTime
            },
            nextQuestion,
            isComplete,
            currentScore
        };
    }

    /**
     * Handle 6-second timeout - mark question as unanswered
     */
    async handleTimeout(interviewId: string, voiceId?: string): Promise<{
        nextQuestion: BotResponse | null;
        isComplete: boolean;
        message: string;
    }> {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }

        const currentIndex = interview.currentQuestionIndex || 0;
        const currentSession = interview.sessions[currentIndex];

        // Mark as skipped/unanswered
        currentSession.wasSkipped = true;
        currentSession.answer.text = '[No Response]';
        currentSession.score = {
            technical: 0,
            communication: 0,
            confidence: 0,
            keywords: [],
            fillerWords: 0
        };

        // Add timeout message audio
        const timeoutMessage = "I didn't hear a response. Let's move to the next question.";

        let nextQuestion: BotResponse | null = null;
        let isComplete = false;

        if (currentIndex >= 4) {
            isComplete = true;
            interview.status = 'completed';
            interview.feedback = await this.generateFinalReport(interview);
        } else {
            // Generate an easier question after timeout
            const previousQA = interview.sessions.map(s => ({
                question: s.question.text,
                answer: s.answer.text,
                score: s.score
            }));

            const nextQuestionText = await this.openAIService.generateFollowUpQuestion(
                interview.jobPosition,
                interview.resumeData || '',
                previousQA,
                'easy', // Always easier after timeout
                undefined
            );

            const nextQuestionAudio = await this.elevenLabsService.textToSpeech(nextQuestionText, voiceId);

            interview.sessions.push({
                question: {
                    text: nextQuestionText,
                    audioUrl: nextQuestionAudio
                },
                answer: { text: '', audioUrl: '' },
                difficulty: 'easy',
                responseTime: 0,
                wasSkipped: false,
                score: {
                    technical: 0,
                    communication: 0,
                    confidence: 0,
                    keywords: [],
                    fillerWords: 0
                }
            });

            interview.currentQuestionIndex = currentIndex + 1;

            nextQuestion = {
                questionText: nextQuestionText,
                audioUrl: nextQuestionAudio,
                questionNumber: currentIndex + 2,
                totalQuestions: 5,
                difficulty: 'easy'
            };
        }

        await interview.save();

        return {
            nextQuestion,
            isComplete,
            message: timeoutMessage
        };
    }

    /**
     * Determine what the next question should be based on performance
     */
    private async determineNextQuestion(
        interview: IInterview,
        analysis: any
    ): Promise<NextQuestionDecision> {
        const avgScore = (analysis.technicalScore + analysis.communicationScore + analysis.confidenceScore) / 3;

        if (interview.sessions.length >= 5) {
            return { action: 'complete', reason: 'Maximum questions reached' };
        }

        if (avgScore >= 80) {
            return { action: 'increase_difficulty', reason: 'Strong performance, increasing challenge' };
        } else if (avgScore >= 50) {
            return { action: 'continue', reason: 'Moderate performance, maintaining level' };
        } else if (avgScore >= 30) {
            return { action: 'decrease_difficulty', reason: 'Struggling, simplifying questions' };
        } else {
            return {
                action: 'switch_domain',
                reason: 'Very low score, switching topic area',
                suggestedDomain: 'general'
            };
        }
    }

    /**
     * Get the next difficulty level
     */
    private getNextDifficulty(
        decision: NextQuestionDecision,
        currentDifficulty?: 'easy' | 'medium' | 'hard'
    ): 'easy' | 'medium' | 'hard' {
        const current = currentDifficulty || 'easy';

        switch (decision.action) {
            case 'increase_difficulty':
                return current === 'easy' ? 'medium' : 'hard';
            case 'decrease_difficulty':
                return current === 'hard' ? 'medium' : 'easy';
            case 'switch_domain':
                return 'easy';
            default:
                return current;
        }
    }

    /**
     * Calculate running average scores
     */
    private calculateCurrentScores(interview: IInterview): {
        technical: number;
        communication: number;
        confidence: number;
    } {
        const answeredSessions = interview.sessions.filter(s => s.answer.text && !s.wasSkipped);

        if (answeredSessions.length === 0) {
            return { technical: 0, communication: 0, confidence: 0 };
        }

        const totals = answeredSessions.reduce((acc, session) => ({
            technical: acc.technical + (session.score?.technical || 0),
            communication: acc.communication + (session.score?.communication || 0),
            confidence: acc.confidence + (session.score?.confidence || 0)
        }), { technical: 0, communication: 0, confidence: 0 });

        return {
            technical: Math.round(totals.technical / answeredSessions.length),
            communication: Math.round(totals.communication / answeredSessions.length),
            confidence: Math.round(totals.confidence / answeredSessions.length)
        };
    }

    /**
     * Generate comprehensive final report
     */
    private async generateFinalReport(interview: IInterview): Promise<string> {
        const report = await this.openAIService.generateFeedback(interview);
        return report;
    }
}
