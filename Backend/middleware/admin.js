import { supabase } from '../lib/supabaseClient.js';

export const checkAdmin = (req, res, next) => {
  const userRole = res.locals.user?.role;
  console.log(`CHECK_ADMIN: El rol del usuario es [${userRole}]`);
  if (userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere ser administrador.' });
  }
};
