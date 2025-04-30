import { Router } from 'express';
import { 
  createInterview, 
  getInterview, 
  startInterview, 
  answerQuestion, 
  completeInterview 
} from '../controllers/interviewController';
import { upload } from '../middleware/fileUpload';

const router = Router();

router.post('/', createInterview);
router.get('/:interviewId', getInterview);
router.post('/:interviewId/start', startInterview);
router.post('/answer', upload.single('audio'), answerQuestion);
router.post('/:interviewId/complete', completeInterview);

export default router;