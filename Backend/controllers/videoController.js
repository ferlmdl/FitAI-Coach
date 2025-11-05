// Archivo: Backend/controllers/videoController.js
import { supabase } from '../lib/supabaseClient.js';
import { spawn } from 'child_process'; // (No se usa en este código, pero lo dejo por si lo usas en otra función)
import path from 'path';
import fs from 'fs';
import VideoModel from '../models/video.js'; 

export const uploadVideos = async (req, res) => {
    
    if (!res.locals.isLoggedIn || !res.locals.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const userId = res.locals.user.id;
    const { title, exerciseType } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No se recibieron videos.' });
    }
    if (!title || !exerciseType) {
        return res.status(400).json({ error: 'Falta el título o el tipo de ejercicio.' });
    }

    const bucketName = 'videos_usuario';

    try {
        for (const file of files) {
            const filePath = path.resolve(file.path);
            const fileExt = path.extname(file.originalname);
            const fileName = `${userId}-${Date.now()}${fileExt}`;
            const uploadPath = `${userId}/${fileName}`;

            const videoBuffer = fs.readFileSync(filePath);

            const { data: storageData, error: storageError } = await supabase.storage
                .from(bucketName)
                .upload(uploadPath, videoBuffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) {
                fs.unlinkSync(filePath); 
                throw new Error(`Error de Storage: ${storageError.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uploadPath);
            
            const publicUrl = publicUrlData.publicUrl;

            // --- ¡CORRECCIÓN AQUÍ! ---
            // Hemos eliminado la línea 'analysis: analysis' que causaba el error.
            await VideoModel.createVideo({
                userId: userId,
                videoUrl: publicUrl,
                title: title,
                exerciseType: exerciseType
                // El modelo se encargará de poner 'status' y 'analysis'
            });
            // -------------------------

            fs.unlinkSync(filePath);
        }

        res.status(201).json({ success: true, message: 'Videos subidos exitosamente.' });

    } catch (err) {
        console.error('Error en uploadVideos:', err);
        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
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