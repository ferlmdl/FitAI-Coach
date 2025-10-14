export const validateRegister = (req, res, next) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }
    next();
};