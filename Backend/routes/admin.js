import express from 'express';
import multer from 'multer';
import { checkAuth } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/admin.js'; // Importamos el nuevo guardia
import { handleUploadExercise } from '../controllers/adminController.js'; // Importamos el nuevo controlador

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});
const router = express.Router();

router.post(
  '/upload-exercise',
  checkAuth,
  checkAdmin,
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  handleUploadExercise
);

export default router;
