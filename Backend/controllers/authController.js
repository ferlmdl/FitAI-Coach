import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users = [];

export const register = async (req, res) => {
    try {
        const { email, name, password, height, weight, level } = req.body;
        if (!email || !name || !password) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
        }
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ success: false, error: 'El usuario ya existe' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ email, name, password: hashedPassword, height, weight, level });
        res.status(201).json({ success: true, message: 'Usuario registrado' });
    } catch (error) {
        console.error('Error en registro: ', error);
        res.status(500).json({ success: false, error: 'Error de servidor' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ email: user.email, name: user.name }, 'secreto', { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (error) {
        console.error('Error en login: ', error);
        res.status(500).json({ success: false, error: 'Error de servidor' });
    }
};