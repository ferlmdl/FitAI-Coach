// Ruta: Backend/controllers/authController.js

import { supabase } from '../lib/supabaseClient.js';

export const register = async (req, res) => {
    try {
        const { email, allName, password, userName, age } = req.body; 
        
        if (!email || !allName || !password || !userName || !age) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Por favor ingresa un correo con formato válido (ejemplo@dominio.com)' 
            });
        }
        
        const verificationUrl = process.env.APP_URL || 'https://fitai-coach-c7qz.onrender.com/verify-email';

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    userName: userName,
                    allName: allName,
                    age: age
                },
                emailRedirectTo: verificationUrl
            }
        });

        if (error) {
            console.error('Error de Supabase al registrar:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.' 
        });

    } catch (error) {
        console.error('Error general en el servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email y password son requeridos' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Error de Supabase al iniciar sesión:', error);
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
        
        const { session, user } = data;
        res.cookie('sb-access-token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: session.expires_in * 1000,
            path: '/' 
        });

        res.cookie('sb-refresh-token', session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30 * 1000,
            path: '/' 
        });

        res.cookie('authToken', session.access_token, {
            maxAge: session.expires_in * 1000,
            path: '/'
        });

        res.status(200).json({ 
            success: true, 
            message: 'Inicio de sesión exitoso', 
            user,
            token: session.access_token
        });
    
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, error: 'Error de servidor' });
    }
};

export const logout = (req, res) => {
    res.cookie('sb-access-token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });
    res.cookie('sb-refresh-token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });
    res.cookie('authToken', '', {
        expires: new Date(0),
        path: '/'
    });

    res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente' });
};
export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Se requiere un correo' });
    }

    const resetUrl = process.env.APP_URL || 'https://fitai-coach-c7qz.onrender.com/update-password';

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl,
        });

        if (error) {
            console.error('Error al solicitar reseteo:', error);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Se ha enviado un enlace de recuperación a tu correo.' 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};

export const updatePassword = async (req, res) => {
    const { accessToken, refreshToken, newPassword } = req.body;

    if (!accessToken || !refreshToken || !newPassword) {
        return res.status(400).json({ success: false, error: 'Faltan datos para actualizar la contraseña.' });
    }

    try {
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        if (sessionError) {
            console.error('Error al establecer sesión con tokens:', sessionError);
            return res.status(401).json({ success: false, error: 'Tokens inválidos o expirados.' });
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            console.error('Error al actualizar contraseña:', updateError);
            return res.status(500).json({ success: false, error: 'No se pudo actualizar la contraseña.' });
        }

        res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};