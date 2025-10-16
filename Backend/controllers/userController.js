const users = [];

export const getUsers = (req, res) => {
    res.json({ success: true, users });
};
export const getUserByEmail = (req, res) => {
    const { email } = req.params;
    const users = users.find(u => u.email === email);
    if (!users) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, users });
};

export const updateUser = (req, res) => {
    const { email } = req.params;
    const users = users.find(u => u.email === email);
    if (!users) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    Object.assign(users, req.body);
    res.json({ success: true, message: 'Usuario actualizado', users });
};

export const deleteUser = (req, res) => {
    const { email } = req.params;
    const index = users.findIndex(u => u.email === email);
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    users.splice(index, 1);
    res.json({ success: true, message: 'Usuario eliminado' });
};