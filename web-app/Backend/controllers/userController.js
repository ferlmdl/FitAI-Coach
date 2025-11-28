import UserModel from '../models/user.js';
import { supabase } from '../lib/supabaseClient.js';

export const updateCurrentUser = async (req, res) => {
  try {
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

    await UserModel.updateUser(userId, updates);
    res.json({ success: true, message: 'Perfil actualizado exitosamente' });

  } catch (error) {
    console.error('Error al actualizar el perfil:', error);

    let userMessage = 'No se pudo actualizar el perfil. Ocurrió un error inesperado.'; 

    if (error.message === 'No se pudo subir la imagen de perfil.') {
      userMessage = 'Hubo un problema al subir la imagen de perfil.';
    }

    if (error.code === '23505') { 
      userMessage = 'El nombre de usuario ingresado ya está en uso. Por favor, elija otro.';
    }
    
    else if (error.code || error.name === 'StorageApiError' || error.__isStorageError) { 
      userMessage = 'Ocurrió un error en el servidor. Por favor, intente más tarde.';
    } 

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
    
    let userMessage = 'No se pudo eliminar la cuenta. Ocurrió un error inesperado.'; 
    if (error.code || error.name === 'StorageApiError' || error.__isStorageError) {
      userMessage = 'Ocurrió un error en el servidor al intentar eliminar la cuenta.';
    }
    res.status(500).json({ success: false, error: userMessage });
  }
};

export const handleToggleFavorite = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado.' });
    }

    const { videoId } = req.body;
    if (typeof videoId !== 'number') {
      return res.status(400).json({ success: false, error: 'El videoId es requerido y debe ser un número.' });
    }

    const result = await UserModel.toggleFavorite(userId, videoId);

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.error('Error al cambiar favorito:', error);

    let userMessage = 'Ocurrió un error inesperado. Por favor, intente más tarde.';
    
    if (error.code === '23503') { 
      userMessage = 'El video que intenta marcar como favorito no existe o fue eliminado.';
    } else if (error.code) {
       userMessage = 'Ocurrió un error en el servidor al guardar su preferencia.';
    }
    
    res.status(500).json({ success: false, error: userMessage });
  }
};
