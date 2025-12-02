import express from 'express';
import { 
    register, 
    login, 
    logout, 
    requestPasswordReset,
    updatePassword
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/request-reset', requestPasswordReset);
router.post('/update-password', updatePassword);

export default router;