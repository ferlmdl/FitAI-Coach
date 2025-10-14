// lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Carga las variables de .env al inicio

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
