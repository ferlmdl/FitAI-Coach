import express from 'express';
import { updateCurrentUser, deleteCurrentUser } from '../controllers/userController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();
router.put('/profile', checkAuth, updateCurrentUser);
router.delete('/profile', checkAuth, deleteCurrentUser);

export default router;