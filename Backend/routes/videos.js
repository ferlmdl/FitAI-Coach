// Archivo: Backend/routes/videos.js

import express from 'express';
import multer from 'multer';
import { uploadVideos, deleteVideo } from '../controllers/videoController.js';
import os from 'os'; // <--- 1. Importa el módulo 'os' (Operating System)

const router = express.Router();

// --- ¡SOLUCIÓN! ---
// 2. Cambia 'dest' para que use el directorio temporal del sistema
const upload = multer({ dest: os.tmpdir() }); 

// 3. Tus rutas siguen igual
router.post('/upload', upload.array('videos', 3), uploadVideos);
router.delete('/:id', deleteVideo);

export default router;