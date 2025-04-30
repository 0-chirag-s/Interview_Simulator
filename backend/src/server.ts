import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import userRoutes from './routes/userRoutes';
import interviewRoutes from './routes/interviewRoutes';
import audioRoutes from './routes/audioRoutes';
import { handleError } from './utils/errorHandler';
import path from 'path';
import fs from 'fs';

const dirs = ['uploads', 'uploads/resumes', 'uploads/audio'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

app.use('/api/users', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/audio', audioRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Interview Simulator API' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  handleError(err, res);
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;