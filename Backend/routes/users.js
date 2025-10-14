import express from 'express';
import { getUserByEmail, getUsers, updateUser, deleteUser} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:email', getUserByEmail);
router.put('/:email', updateUser);
router.delete('/:email', deleteUser);

export default router;