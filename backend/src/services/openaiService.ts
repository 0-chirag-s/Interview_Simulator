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
        interviewSummary += `A${index + 1}: ${session.answer.text}\n\n`;
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
}