import { supabase } from '../lib/supabaseClient.js';

const appUrl = process.env.APP_URL || 'https://friendly-fishstick-9pjpqr54gwpcx946-3000.app.github.dev/';

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

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    userName: userName,
                    allName: allName,
                    age: age
                },
            }
        });

        if (error) {
            console.error('Error de Supabase al registrar:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(201).json({ success: true, user: data.user });

    } catch (error) {
        console.error('Error general en el servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
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

        // Establecer cookie de autenticación para las vistas
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
    res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente' });
};

export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Se requiere un correo electrónico.' });
    }

    const resetUrl = `${appUrl}/update-password`;

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl,
        });

        if (error) {
            console.error('Error al solicitar reseteo:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Si el correo existe, recibirás un enlace de recuperación en breve.' 
        });

    } catch (error) {
        console.error('Error interno:', error);
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
            console.error('Error de sesión al actualizar pass:', sessionError);
            return res.status(401).json({ success: false, error: 'El enlace ha expirado o es inválido.' });
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            console.error('Error al actualizar contraseña:', updateError);
            return res.status(400).json({ success: false, error: 'No se pudo actualizar la contraseña. Intenta con otra.' });
        }

        res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        console.error('Error interno:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};