// Archivo: Backend/controllers/videoController.js
import { supabase } from '../lib/supabaseClient.js';
import path from 'path';
import fs from 'fs';
import VideoModel from '../models/video.js';
import axios from 'axios';

// URL de tu servicio de IA
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const uploadVideos = async (req, res) => {
    try {
        // --- 1. RECUPERACIÓN DE DATOS (Arregla el ReferenceError) ---
        const files = req.files; 
        const { title, exerciseType } = req.body;
        const userId = res.locals.user ? res.locals.user.id : null;

        // --- 2. VALIDACIONES BÁSICAS ---
        if (!res.locals.isLoggedIn || !userId) {
            return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
        }
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron videos.' });
        }
        if (!title || !exerciseType) {
            return res.status(400).json({ error: 'Falta el título o el tipo de ejercicio.' });
        }

        // --- 3. EXTRACCIÓN DEL TOKEN (Lógica basada en tus Cookies) ---
        let authToken = req.headers.authorization;

        // Si no vino en el header, lo sacamos de las cookies que vimos en tu log
        if (!authToken && req.cookies) {
            // Prioridad 1: Cookie 'sb-access-token' (Estándar Supabase)
            if (!authToken && req.cookies) {
            // Prioridad 1: Cookie 'sb-access-token'
            if (req.cookies['sb-access-token']) {
                // --- MEJORA: LIMPIEZA DE TOKEN ---
                let rawToken = req.cookies['sb-access-token'];
                // Quitamos comillas dobles si existen al principio o final
                rawToken = rawToken.replace(/^"|"$/g, ''); 
                
                authToken = `Bearer ${rawToken}`;
                console.log("✅ Token recuperado y LIMPIADO de cookie: sb-access-token");
            }
            // Prioridad 2: Cookie 'authToken' (Parece ser custom tuya)
            else if (req.cookies['authToken']) {
                authToken = `Bearer ${req.cookies['authToken']}`;
                console.log("✅ Token recuperado de cookie: authToken");
            }
        }
    }

        // Debug final para estar seguros
        console.log("🔑 Token para IA:", authToken ? "LISTO" : "❌ VACÍO (Fallará la IA)");

        const bucketName = 'videos_usuario';
        const uploadedUrls = [];

        // --- 4. PROCESAMIENTO DE VIDEOS ---
        for (const file of files) {
            const filePath = path.resolve(file.path);
            const ext = path.extname(file.originalname) || '.mp4';
            const fileName = `${userId}-${Date.now()}${ext}`;
            const uploadPath = `${userId}/${fileName}`;

            // A. Subir a Supabase Storage
            const buffer = fs.readFileSync(filePath);
            const { error: storageError } = await supabase.storage
                .from(bucketName)
                .upload(uploadPath, buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) {
                try { fs.unlinkSync(filePath); } catch(e){}
                return res.status(500).json({ success: false, error: 'Error subiendo al storage', details: storageError });
            }

            // B. Obtener URL Pública
            const { data: publicUrlData } = await supabase.storage
                .from(bucketName)
                .getPublicUrl(uploadPath);

            const publicUrl = publicUrlData?.publicUrl || null;

            // C. Guardar en Base de Datos
            let createdVideoId = null;
            try {
                const videoData = {
                    user_id: userId,
                    video_route: publicUrl, // URL pública para el frontend
                    title: title,
                    exercise_type: exerciseType
                };

                const created = await VideoModel.createVideo(videoData);
                // Manejo robusto del ID devuelto
                createdVideoId = created?.id || (Array.isArray(created) ? created[0]?.id : null);
                
                console.log(`💾 Video guardado en BD. ID: ${createdVideoId}`);

            } catch (e) {
                console.error('Error guardando en BD:', e);
                try { await supabase.storage.from(bucketName).remove([uploadPath]); } catch(err){}
                try { fs.unlinkSync(filePath); } catch(err){}
                return res.status(500).json({ success: false, error: 'Error guardando metadata en BD', details: e.message });
            }

            // D. LLAMAR A LA IA (Ahora sí con el token de la cookie)
            try {
                if (createdVideoId && publicUrl && authToken) {
                    console.log(`📡 Enviando video ${createdVideoId} a la IA...`);
                    
                    // Axios NO espera (fire and forget) para no trabar la respuesta al usuario
                    axios.post(`${AI_SERVICE_URL}/analyze/`, {
                        video_route: publicUrl,
                        exercise: exerciseType,
                        video_id: createdVideoId
                    }, {
                        headers: {
                            'Authorization': authToken, // Aquí va el token que sacamos de la cookie
                            'Content-Type': 'application/json'
                        }
                    }).then(() => {
                        console.log("✅ IA recibió la petición correctamente (200 OK)");
                    }).catch(err => {
        console.error("❌ Error llamando a IA:", err.message);
        
        // --- CÓDIGO DE DIAGNÓSTICO 422 ---
        if (err.response) {
            console.error("🔥 Status Code:", err.response.status);
            console.error("🔍 DETALLE DEL ERROR (Lo que Python reclama):");
            // Esto imprimirá qué campo falta: "field required", "loc": ["body", "video_url"]
            console.dir(err.response.data, { depth: null, colors: true });
        }
        // ---------------------------------
    });
                } else {
                    console.warn("⚠️ No se llamó a la IA: Falta ID, URL o Token.");
                }
            } catch (aiError) {
                
                console.error("Excepción intentando contactar IA:", aiError);
            }

            // Limpieza
            try { fs.unlinkSync(filePath); } catch(e){}
            uploadedUrls.push(publicUrl);
        }

        res.status(201).json({ success: true, uploaded: uploadedUrls, message: "Videos subidos y análisis iniciado." });

    } catch (err) {
        console.error('🔥 Error crítico en uploadVideos:', err);
        // Limpieza de emergencia
        if (req.files) {
            req.files.forEach(f => { try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(e){} });
        }
        res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
    }
};

// --- MANTÉN TUS OTRAS FUNCIONES (deleteVideo, etc.) IGUAL QUE ANTES ---
export const deleteVideo = async (req, res) => {
    // ... Tu código de deleteVideo ...
    if (!res.locals.isLoggedIn || !res.locals.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    // (Puedes copiar y pegar tu deleteVideo anterior aquí si lo borraste)
    // Para simplificar, asumo que solo copiaste uploadVideos o tienes el resto abajo.
    // Si necesitas que te pase el archivo ENTERO con deleteVideo incluido, dímelo.
    const userId = res.locals.user.id;
    const videoId = req.params.id;
    const { videoRoute } = req.body; 

    if (!videoRoute) return res.status(400).json({ error: 'Falta la ruta del video.' });

    try {
        const video = await VideoModel.getVideoById(videoId);
        if (!video) return res.status(404).json({ error: 'Video no encontrado.' });
        if (video.user_id !== userId) return res.status(403).json({ error: 'No tienes permiso.' });

        const bucketName = 'videos_usuario'; 
        const fileName = videoRoute.split(`${bucketName}/`).pop();

        if (fileName) {
            await supabase.storage.from(bucketName).remove([fileName]);
        }
        await VideoModel.deleteVideo(videoId);
        res.status(200).json({ success: true, message: 'Video borrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
        if (!video) return res.status(404).json({ success: false, error: 'Video no encontrado.' });
        res.json({ success: true, video });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};