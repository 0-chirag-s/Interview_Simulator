import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { config } from '../config';
import { AppError } from '../utils/errorHandler';

export class OpenAIService {
  private client: any;

  constructor() {
    const token = config.githubToken;
    if (!token) {
      console.warn('GitHub token is not set');
      return;
    }

    this.client = ModelClient(
      config.openaiEndpoint,
      new AzureKeyCredential(token as string)
    );
  }

  async generateInterviewQuestions(jobPosition: string, resumeData?: string, numQuestions: number = 5): Promise<string[]> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      let prompt = `Generate ${numQuestions} professional interview questions for a ${jobPosition} position.`;

      if (resumeData) {
        prompt += ` The candidate has the following resume information: ${resumeData}. 
        Tailor the questions to this candidate's experience and the specific job role.`;
      }

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are a professional interviewer assistant. Generate relevant and challenging interview questions for job candidates." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          top_p: 1,
          model: config.openaiModel
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      const content = response.body.choices[0].message.content;

      // Parse the questions from the content (assuming they are numbered or in a list)
      const questions = content.split(/\d+\./).filter(Boolean).map((q: string) => q.trim());

      return questions;
    } catch (error: any) {
      console.error('Error generating interview questions:', error.message);
      throw new AppError(error.message || 'Failed to generate interview questions', 500);
    }
  }

  async generateInterviewer(jobPosition: string): Promise<any> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      const prompt = `Create a realistic interviewer profile for a ${jobPosition} position. 
      Include the following information: name, personality, industry knowledge and background.`;

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are an AI assistant that creates realistic interviewer profiles." },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          top_p: 1,
          model: config.openaiModel
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      const content = response.body.choices[0].message.content;

      // Parse the response to create an interviewer object
      // This is a simplified parsing, you might want to use regex or a more robust parser
      const name = content.match(/name:?\s*([^\n]+)/i)?.[1] || 'Professional Interviewer';
      const personality = content.match(/personality:?\s*([^\n]+)/i)?.[1] || 'Professional and thorough';
      const industry = content.match(/industry:?\s*([^\n]+)/i)?.[1] || jobPosition.split(' ')[0];

      return {
        name,
        personality,
        industry,
        jobRole: jobPosition,
        isCustom: false
      };
    } catch (error: any) {
      console.error('Error generating interviewer profile:', error.message);
      throw new AppError(error.message || 'Failed to generate interviewer profile', 500);
    }
  }

  async generateFeedback(interviewData: any): Promise<string> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      let interviewSummary = '';

      interviewData.sessions.forEach((session: any, index: number) => {
        interviewSummary += `Q${index + 1}: ${session.question.text}\n`;
        interviewSummary += `A${index + 1}: ${session.answer.text}\n`;
        if (session.score) {
          interviewSummary += `Score: Technical ${session.score.technical}/100, Communication ${session.score.communication}/100\n`;
        }
        interviewSummary += '\n';
      });

      const prompt = `Provide detailed feedback for a candidate interviewed for ${interviewData.jobPosition} position. 
      Here are the questions and answers from the interview:
      
      ${interviewSummary}
      
      Analyze the answers and provide constructive feedback on:
      1. Communication skills
      2. Relevance and quality of answers
      3. Strengths demonstrated
      4. Areas for improvement
      5. Overall performance rating`;

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are a professional interview evaluator. Provide detailed and constructive feedback for job candidates." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          top_p: 1,
          model: config.openaiModel,
          max_tokens: 1500
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      return response.body.choices[0].message.content;
    } catch (error: any) {
      console.error('Error generating feedback:', error.message);
      throw new AppError(error.message || 'Failed to generate feedback', 500);
    }
  }

  /**
   * Generate initial questions based on resume content
   */
  async generateInitialQuestionsFromResume(
    jobPosition: string,
    resumeData: string,
    count: number = 3
  ): Promise<string[]> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      const prompt = resumeData && resumeData.trim().length > 50
        ? `You are conducting a professional interview for a ${jobPosition} position.

CANDIDATE'S RESUME:
${resumeData.substring(0, 3000)}

Generate ${count} interview questions following this EXACT progression:

1. INTRODUCTION QUESTION: Ask about their most recent role or experience mentioned in the resume. Be specific - mention the company name or project if available.

2. TECHNICAL DEEP-DIVE: Ask about a specific technology, framework, or skill they listed. Request a concrete example of how they used it.

3. PROJECT EXPERIENCE: Ask them to walk through a specific project from their resume - the challenges faced, their role, and the outcome.

IMPORTANT:
- Reference SPECIFIC details from their resume (company names, technologies, project names)
- Make questions conversational and natural
- Each question should take 30-60 seconds to answer

Format: Return ONLY the questions, numbered 1-${count}, one per line.`
        : `You are conducting a professional interview for a ${jobPosition} position.

The candidate has not provided a resume. Generate ${count} general interview questions:

1. Ask about their background and interest in ${jobPosition}
2. Ask about their relevant skills and experience
3. Ask about a challenging project or problem they have solved

Format: Return ONLY the questions, numbered 1-${count}, one per line.`;

      console.log('Generating initial questions with resume data length:', resumeData?.length || 0);

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are an experienced technical interviewer who creates personalized, engaging interview questions based on the candidate's background. Your questions are specific, professional, and designed to let candidates showcase their experience." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          top_p: 1,
          model: config.openaiModel,
          max_tokens: 800
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      const content = response.body.choices[0].message.content;
      console.log('Generated questions:', content);
      const questions = content.split(/\d+\./).filter(Boolean).map((q: string) => q.trim());

      return questions.slice(0, count);
    } catch (error: any) {
      console.error('Error generating initial questions:', error.message);
      throw new AppError(error.message || 'Failed to generate initial questions', 500);
    }
  }

  /**
   * Generate adaptive follow-up question based on previous performance
   */
  async generateFollowUpQuestion(
    jobPosition: string,
    resumeData: string,
    previousQA: Array<{ question: string; answer: string; score?: any }>,
    difficulty: 'easy' | 'medium' | 'hard',
    suggestedDomain?: string
  ): Promise<string> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      // Build rich context from previous Q&A
      let qaContext = previousQA.map((qa, i) =>
        `Question ${i + 1}: ${qa.question}\nCandidate's Answer: ${qa.answer}${qa.score ? `\n(Technical: ${qa.score.technical}/100, Communication: ${qa.score.communication}/100)` : ''}`
      ).join('\n\n');

      const difficultyInstructions = {
        easy: 'Ask a straightforward question that lets them explain a concept or share an experience.',
        medium: 'Ask a question requiring them to demonstrate applied knowledge with specific examples.',
        hard: 'Ask a complex question about trade-offs, system design, architecture decisions, or deep technical analysis.'
      };

      const questionNumber = previousQA.length + 1;

      const prompt = `You are conducting a ${jobPosition} interview. This is question #${questionNumber}.

PREVIOUS CONVERSATION:
${qaContext}

${resumeData ? `CANDIDATE'S RESUME (for context):\n${resumeData.substring(0, 1500)}` : ''}

Generate the NEXT interview question following these rules:

1. PROGRESSION: Build logically on their previous answers. If they mentioned something interesting, explore it deeper.

2. DIFFICULTY: ${difficulty.toUpperCase()} - ${difficultyInstructions[difficulty]}

3. ${suggestedDomain ? `FOCUS AREA: ${suggestedDomain}` : "NATURAL FLOW: Connect to topics they've discussed or skills from their resume"}

4. AVOID:
   - Repeating any previous questions
   - Generic questions that don't reference their experience
   - Yes/no questions

5. QUESTION STYLE:
   - Be conversational (e.g., "You mentioned X... can you tell me more about...")
   - Should take 30-60 seconds to answer properly
   - Show you were listening to their previous answers

Return ONLY the question text, nothing else.`;

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are an experienced interviewer who creates thoughtful, personalized follow-up questions. Your questions show genuine interest in the candidate's experience and naturally build upon their previous responses." },
            { role: "user", content: prompt }
          ],
          temperature: 0.75,
          top_p: 1,
          model: config.openaiModel,
          max_tokens: 250
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      return response.body.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('Error generating follow-up question:', error.message);
      throw new AppError(error.message || 'Failed to generate follow-up question', 500);
    }
  }

  /**
   * Analyze a candidate's answer using NLP
   */
  async analyzeAnswer(
    question: string,
    answer: string,
    jobPosition: string
  ): Promise<{
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    keywords: string[];
    fillerWordCount: number;
    feedback: string;
  }> {
    try {
      if (!this.client) {
        throw new AppError('OpenAI client is not configured properly', 500);
      }

      // Count filler words
      const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of'];
      const lowerAnswer = answer.toLowerCase();
      let fillerWordCount = 0;
      fillerWords.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerAnswer.match(regex);
        if (matches) fillerWordCount += matches.length;
      });

      const prompt = `Analyze this interview answer for a ${jobPosition} position.

Question: ${question}
Answer: ${answer}

Evaluate and respond in this EXACT JSON format:
{
  "technicalScore": <0-100 based on technical accuracy, depth, use of correct terminology>,
  "communicationScore": <0-100 based on clarity, structure, conciseness>,
  "confidenceScore": <0-100 based on assertiveness, no hedging language, direct responses>,
  "keywords": [<list of technical keywords/concepts correctly used>],
  "feedback": "<one sentence of constructive feedback>"
}

Scoring guide:
- 80-100: Excellent, demonstrates expertise
- 60-79: Good, shows solid understanding
- 40-59: Average, basic knowledge present
- 20-39: Below average, gaps in understanding
- 0-19: Poor, incorrect or no relevant content

Return ONLY valid JSON, no other text.`;

      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: "You are an expert interview evaluator. Always respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          top_p: 1,
          model: config.openaiModel,
          max_tokens: 300
        }
      });

      if (isUnexpected(response)) {
        throw new AppError(response.body.error?.message || 'OpenAI API error', 500);
      }

      const content = response.body.choices[0].message.content;

      try {
        const analysis = JSON.parse(content);
        return {
          technicalScore: Math.min(100, Math.max(0, analysis.technicalScore || 0)),
          communicationScore: Math.min(100, Math.max(0, analysis.communicationScore || 0)),
          confidenceScore: Math.min(100, Math.max(0, analysis.confidenceScore || 0)),
          keywords: analysis.keywords || [],
          fillerWordCount,
          feedback: analysis.feedback || ''
        };
      } catch (parseError) {
        console.error('Error parsing analysis JSON:', parseError);
        // Return default scores if parsing fails
        return {
          technicalScore: 50,
          communicationScore: 50,
          confidenceScore: 50,
          keywords: [],
          fillerWordCount,
          feedback: 'Analysis completed'
        };
      }
    } catch (error: any) {
      console.error('Error analyzing answer:', error.message);
      throw new AppError(error.message || 'Failed to analyze answer', 500);
    }
  }
}