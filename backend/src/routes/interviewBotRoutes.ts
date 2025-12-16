import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    startBotInterview,
    submitResponse,
    handleTimeout,
    getInterviewStatus,
    completeEarly
} from '../controllers/interviewBotController';

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/audio');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'response-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid audio file type'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Start a new conversational interview
router.post('/start', startBotInterview);

// Submit an audio response
router.post('/respond', upload.single('audio'), submitResponse);

// Handle 6-second timeout
router.post('/timeout', handleTimeout);

// Get current interview status
router.get('/status/:interviewId', getInterviewStatus);

// Complete interview early
router.post('/complete/:interviewId', completeEarly);

export default router;
