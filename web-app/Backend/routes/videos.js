import express from 'express';
import multer from 'multer';
import { uploadVideos, deleteVideo } from '../controllers/videoController.js';
import os from 'os';

const router = express.Router();

const upload = multer({ dest: os.tmpdir() }); 

router.post('/upload', upload.array('videos', 3), uploadVideos);
router.delete('/:id', deleteVideo);

export default router;