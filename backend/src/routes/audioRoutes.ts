import { Router } from 'express';
import { textToSpeech, speechToText, getVoices } from '../controllers/audioController';
import { upload } from '../middleware/fileUpload';

const router = Router();

router.post('/text-to-speech', textToSpeech);
router.post('/speech-to-text', upload.single('audio'), speechToText);
router.get('/voices', getVoices);

export default router;