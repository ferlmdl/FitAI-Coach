// Archivo: Backend/controllers/videoController.js
import { supabase } from '../lib/supabaseClient.js';
import path from 'path';
import fs from 'fs';
import VideoModel from '../models/video.js';

export const uploadVideos = async (req, res) => {
    try {
        if (!res.locals.isLoggedIn || !res.locals.user) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const userId = res.locals.user.id;
        const { title, exerciseType } = req.body;
        const files = req.files;

        console.log('uploadVideos invoked', { userId, title, exerciseType, filesCount: files?.length });

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron videos.' });
        }
        if (!title || !exerciseType) {
            return res.status(400).json({ error: 'Falta el título o el tipo de ejercicio.' });
        }

        const bucketName = 'videos_usuario';
        const uploadedUrls = [];

        for (const file of files) {
            const filePath = path.resolve(file.path);
            const ext = path.extname(file.originalname) || '.mp4';
            const fileName = `${userId}-${Date.now()}${ext}`;
            const uploadPath = `${userId}/${fileName}`;

            console.log('Subiendo a supabase:', { filePath, uploadPath });

            // Intentar subir buffer (multer ya guardó en disco)
            const buffer = fs.readFileSync(filePath);
            const { data: storageData, error: storageError } = await supabase.storage
                .from(bucketName)
                .upload(uploadPath, buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) {
                console.error('storageError', storageError);
                // limpiar temporal antes de responder
                try { fs.unlinkSync(filePath); } catch(e){}
                return res.status(500).json({ success: false, error: 'Error subiendo al storage', details: storageError });
            }

            // Obtener URL pública o almacenar ruta en BD si bucket privado
            const { data: publicUrlData, error: publicUrlError } = await supabase.storage
                .from(bucketName)
                .getPublicUrl(uploadPath);

            if (publicUrlError) {
                console.warn('getPublicUrl error', publicUrlError);
            }

            const publicUrl = publicUrlData?.publicUrl || null;
            console.log('Upload OK, publicUrl:', publicUrl);

            // Guardar metadatos en la tabla 'video'
            try {
                const created = await VideoModel.createVideo({
                    userId,
                    videoUrl: publicUrl,
                    storagePath: uploadPath,
                    title,
                    exerciseType
                });
                console.log('VideoModel.createVideo result:', created);
            } catch (e) {
                console.error('Error guardando metadata en BD:', e);
                // Decide si eliminar del storage en caso de fallo en BD
                // await supabase.storage.from(bucketName).remove([uploadPath]);
                try { fs.unlinkSync(filePath); } catch(e){}
                return res.status(500).json({ success: false, error: 'Error guardando metadata en BD', details: e.message || e });
            }

            // eliminar temporal multer
            try { fs.unlinkSync(filePath); } catch(e){}
            uploadedUrls.push(publicUrl);
        }

        res.status(201).json({ success: true, uploaded: uploadedUrls });
    } catch (err) {
        console.error('Error en uploadVideos unexpected:', err);
        // limpiar temporales remanentes
        if (req.files) {
            req.files.forEach(f => {
                try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(e){}
            });
        }
        res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
    }
};

// --- (El resto de tus funciones: deleteVideo, getUserVideos, getVideoById...) ---
// (Tu función deleteVideo tiene el bucketName 'videos_usuario' correcto, ¡excelente!)

export const deleteVideo = async (req, res) => {
    
    if (!res.locals.isLoggedIn || !res.locals.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const userId = res.locals.user.id;
    const videoId = req.params.id;
    const { videoRoute } = req.body;

    if (!videoRoute) {
        return res.status(400).json({ error: 'Falta la ruta del video.' });
    }

    try {
        const video = await VideoModel.getVideoById(videoId);
        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado.' });
        }
        if (video.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para borrar este video.' });
        }

        const bucketName = 'videos_usuario'; 
        const fileName = videoRoute.split(`${bucketName}/`).pop();

        if (fileName) {
            const { error: storageError } = await supabase.storage
                .from(bucketName)
                .remove([fileName]);

            if (storageError) {
                console.warn('Error borrando de Storage (quizás ya no existía):', storageError.message);
            }
        }

        await VideoModel.deleteVideo(videoId);

        res.status(200).json({ success: true, message: 'Video borrado exitosamente.' });

    } catch (err) {
        console.error('Error en deleteVideo:', err);
        res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
    }
};

export const getUserVideos = async (req, res) => {
    const { userId } = req.params;
    try {
        const videos = await VideoModel.getVideosByUserId(userId);
        res.json({ success: true, videos });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};

export const getVideoById = async (req, res) => {
    const { videoId } = req.params;
    try {
        const video = await VideoModel.getVideoById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, error: 'Video no encontrado.' });
        }
        res.json({ success: true, video });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};