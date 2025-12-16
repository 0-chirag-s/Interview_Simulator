import mongoose, { Schema, Document } from 'mongoose';

export interface IScore {
  technical: number;
  communication: number;
  confidence: number;
  keywords: string[];
  fillerWords: number;
}

export interface IQuestion {
  text: string;
  audioUrl?: string;
}

export interface IAnswer {
  text: string;
  audioUrl?: string;
}

export interface IInterviewSession {
  question: IQuestion;
  answer: IAnswer;
  score?: IScore;
  responseTime?: number;
  wasSkipped?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ITotalScore {
  technical: number;
  communication: number;
  confidence: number;
  overall: number;
}

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  interviewerId: mongoose.Types.ObjectId;
  jobPosition: string;
  resumeData?: string;
  sessions: IInterviewSession[];
  feedback?: string;
  status: 'pending' | 'in-progress' | 'completed';
  // New conversational interview fields
  interviewMode: 'batch' | 'conversational';
  currentQuestionIndex: number;
  totalScore?: ITotalScore;
  pendingQuestions?: string[];
}

const ScoreSchema = new Schema({
  technical: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  keywords: [{ type: String }],
  fillerWords: { type: Number, default: 0 }
}, { _id: false });

const InterviewSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  interviewerId: { type: Schema.Types.ObjectId, ref: 'Interviewer', required: true },
  jobPosition: { type: String, required: true },
  resumeData: { type: String },
  sessions: [{
    question: {
      text: { type: String, required: true },
      audioUrl: { type: String }
    },
    answer: {
      text: { type: String },
      audioUrl: { type: String }
    },
    score: ScoreSchema,
    responseTime: { type: Number },
    wasSkipped: { type: Boolean, default: false },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' }
  }],
  feedback: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  // New conversational interview fields
  interviewMode: { type: String, enum: ['batch', 'conversational'], default: 'batch' },
  currentQuestionIndex: { type: Number, default: 0 },
  totalScore: {
    technical: { type: Number },
    communication: { type: Number },
    confidence: { type: Number },
    overall: { type: Number }
  },
  pendingQuestions: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IInterview>('Interview', InterviewSchema);