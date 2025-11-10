import { supabase } from '../lib/supabaseClient.js';

export const checkAuth = async (req, res, next) => {
  const token = req.cookies['sb-access-token'];

  if (!token) {
    res.locals.isLoggedIn = false;
    return next();
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.locals.isLoggedIn = false;
    return next();
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('userName, role, avatar_url, allName, age, created_at') 
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    res.locals.isLoggedIn = false;
    return next();
  }
  
  res.locals.isLoggedIn = true;
  res.locals.user = {
    id: user.id,
    email: user.email,
    ...profile
  };

  next();
};