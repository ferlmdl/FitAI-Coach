const users = [];

export const getUsers = (req, res) => {
    res.json({ success: true, users });
};
export const getUserByEmail = (req, res) => {
    const { email } = req.params;
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, user });
};

export const updateUser = (req, res) => {
    const { email } = req.params;
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    Object.assign(user, req.body);
    res.json({ success: true, message: 'Usuario actualizado', user });
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