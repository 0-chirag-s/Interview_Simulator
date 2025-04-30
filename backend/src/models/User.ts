import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  resume?: string; 
  interviews: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resume: { type: String },
  interviews: [{ type: Schema.Types.ObjectId, ref: 'Interview' }]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

