import express from 'express';
import { updateCurrentUser, deleteCurrentUser } from '../controllers/userController.js';
import { checkAuth } from '../middleware/auth.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.put('/profile', checkAuth, upload.single('avatarFile'), updateCurrentUser);

router.delete('/profile', checkAuth, deleteCurrentUser);

export default router;