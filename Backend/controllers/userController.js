import UserModel from '../models/user.js';

export const updateCurrentUser = async (req, res) => {
    try {
        const userId = res.locals.user.id;
        
        const { allName, userName, age } = req.body;
        const updates = { allName, userName, age };

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