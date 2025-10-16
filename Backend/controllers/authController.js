import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient.js';

export const register = async (req, res) => {
    try {
        const { email, name, password } = req.body; 
        
        if (!email || !name || !password) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('profiles') 
            .insert([
                {
                    email: email,
                    name: name,
                    password: hashedPassword 
                }
            ])
            .select(); 

        if (error) {
            console.error('Error de Supabase al insertar:', error);
            if (error.code === '23505') {
                return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado' });
            }
            return res.status(500).json({ success: false, error: 'Error al registrar el usuario en la base de datos' });
        }

        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' });

    } catch (error) {
        console.error('Error general en el servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single(); 

        if (error && error.code !== 'PGRST116') { 
            console.error('Error de Supabase al buscar usuario:', error);
            return res.status(500).json({ success: false, error: 'Error en la base de datos' });
        }
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, 'secreto', { expiresIn: '1h' });
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000, 
            path: '/' 
        });

        res.status(200).json({ success: true, message: 'Inicio de sesión exitoso' });
    
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, error: 'Error de servidor' });
    }
};
export const logout = (req, res) => {
    res.cookie('authToken', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });
    res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente' });
};
