import mongoose, { Schema, Document } from 'mongoose';

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
}

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  interviewerId: mongoose.Types.ObjectId;
  jobPosition: string;
  resumeData?: string;
  sessions: IInterviewSession[];
  feedback?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

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
    }
  }],
  feedback: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IInterview>('Interview', InterviewSchema);