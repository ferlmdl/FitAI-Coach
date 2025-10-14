import express from 'express';
import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import videosRouter from './routes/videos.js';
import 'dotenv/config';
import { supabase } from './lib/supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const PORT = process.env.PORT || 3000;

async function testSupabaseConnection() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error al conectar con Supabase:', error);
    } else {
        console.log('Conexión a Supabase exitosa. Datos de prueba:', data);
    }

}

testSupabaseConnection();
app.engine(
  "html",
  engine({
    extname: ".html",
    layoutsDir: path.join(__dirname, '../Frontend/layouts'),
    partialsDir: path.join(__dirname, '../Frontend/partials'),
    defaultLayout: "principal",
    helpers: {
      json: function(context) {
        return JSON.stringify(context);
      }
    }
  })
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/videos', videosRouter);


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});