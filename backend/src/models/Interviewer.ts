
import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewer extends Document {
  name: string;
  avatar?: string;
  voiceId?: string; 
  personality?: string;
  industry?: string;
  jobRole?: string;
  isCustom: boolean;
}

const InterviewerSchema: Schema = new Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  voiceId: { type: String },
  personality: { type: String },
  industry: { type: String },
  jobRole: { type: String },
  isCustom: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IInterviewer>('Interviewer', InterviewerSchema);