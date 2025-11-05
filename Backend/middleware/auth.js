import { supabase } from '../lib/supabaseClient.js';

export const checkAuth = async (req, res, next) => {
  
const token = req.cookies['sb-access-token'];

  if (!token) {
    res.locals.isLoggedIn = false;
    return next();
  }

const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.locals.isLoggedIn = false;
  } else {
    res.locals.isLoggedIn = true;
    res.locals.user = user; 
  }

  next();
};
