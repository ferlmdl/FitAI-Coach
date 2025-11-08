import UserModel from '../models/user.js';
import { supabase } from '../lib/supabaseClient.js';

export const updateCurrentUser = async (req, res) => {
    try {
        // 1. Verificación de ID al inicio
        const userId = res.locals.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'No autorizado.' });
        }

        const { allName, userName, age } = req.body;
        const updates = { allName, userName, age };

        if (req.file) {
            const file = req.file;
            const fileBuffer = file.buffer;
            
            const fileName = `user_${userId}/${Date.now()}_${file.originalname}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatar') 
                .upload(fileName, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: true 
                });

            if (uploadError) {
                console.error('Error al subir avatar a Supabase:', uploadError);
                throw new Error('No se pudo subir la imagen de perfil.');
            }

            const { data: publicUrlData } = supabase.storage
                .from('avatar')
                .getPublicUrl(uploadData.path);

            updates.avatar_url = publicUrlData.publicUrl;
        }

        // Actualiza el usuario en la base de datos
        await UserModel.updateUser(userId, updates);
        res.json({ success: true, message: 'Perfil actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);

        // --- FIX 4: Lógica de errores mejorada ---
        let userMessage = 'Lo sentimos, pero no le pagamos lo suficiente a nuestros desarrolladores.'; // Mensaje por defecto

        // Errores específicos (van primero)
        if (error.message === 'No se pudo subir la imagen de perfil.') {
            userMessage = 'Hubo un problema subiendo tu foto. ¿Quizás nuestra base de datos se tomó un descanso?';
        }
        
        // --- FIX 5: Código de error de PostgreSQL para "ya existe" ---
        if (error.code === '23505') { 
            userMessage = 'Ese nombre de usuario ya existe. ¡Prueba con uno más original!';
        }
        
        // Error genérico de BD (si no es ninguno de los anteriores)
        else if (error.code || error.name === 'StorageApiError' || error.__isStorageError) { // (Usamos doble guion bajo)
            userMessage = 'Lo sentimos, pero nuestra base de datos se está tomando un descanso. Por favor, intenta más tarde.';
        } 
        
        // --- FIX 1: Respuesta de error movida fuera de los 'if' ---
        res.status(500).json({ success: false, error: userMessage });
    }
};

export const deleteCurrentUser = async (req, res) => {
    try {
        const userId = res.locals.user.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'No autorizado o ID de usuario no encontrado.' });
        }

        await UserModel.deleteUser(userId);
        
        res.clearCookie('sb-access-token');
        
        res.status(204).send();

    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        
        // --- Lógica de error gracioso añadida ---
        let userMessage = 'Lo sentimos, pero no le pagamos lo suficiente a nuestros desarrolladores.'; // Default
        
        if (error.code || error.name === 'StorageApiError' || error.__isStorageError) {
            userMessage = 'Nuestra base de datos se aferra a tu cuenta. No te quiere dejar ir. Intenta de nuevo.';
        }
        
        res.status(500).json({ success: false, error: userMessage });
    }
};