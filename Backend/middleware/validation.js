export const validateRegister = (req, res, next) => {
    const { email, allName, password } = req.body;
    if (!email || !allName || !password) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }
    next();
};