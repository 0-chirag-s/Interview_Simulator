import { Router } from 'express';
import { createUser, getUser, uploadResume } from '../controllers/userController';
import { upload } from '../middleware/fileUpload';

const router = Router();

router.post('/', createUser);
router.get('/:userId', getUser);
router.post('/:userId/resume', upload.single('resume'), uploadResume);

export default router;