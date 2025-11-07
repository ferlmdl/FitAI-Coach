import UserModel from '../models/user.js';
import { supabase } from '../lib/supabaseClient.js';
export const updateCurrentUser = async (req, res) => {
    try {
        const userId = res.locals.user.id;
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

        await UserModel.updateUser(userId, updates);
        res.json({ success: true, message: 'Perfil actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ success: false, error: error.message || 'Error interno del servidor.' });
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
        res.status(500).json({ success: false, error: error.message || 'Error interno del servidor.' });
    }
};