import express from 'express';
import multer from 'multer';
import { uploadAndAnalyzeVideo as analyzeVideo } from '../controllers/videoController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); 
router.post('/upload', upload.single('video'), analyzeVideo);

export default router;