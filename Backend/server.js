import express from 'express';
import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import videosRouter from './routes/videos.js';
import 'dotenv/config';
import { supabase } from './lib/supabaseClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import { checkAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

async function testSupabaseConnection() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1); 
    if (error) {
        console.error('Error al conectar con Supabase:', error);
    } else {
        console.log('Conexión a Supabase exitosa. Datos de prueba:', data);
    }

}

testSupabaseConnection();

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        layoutsDir: path.join(__dirname, '../Backend/views/layouts'),
        partialsDir: path.join(__dirname, '../Backend/views/partials'),
        defaultLayout: "main",
        helpers: {
            json: function(context) {
                return JSON.stringify(context);
            }
        }
    })
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.json());
app.use(cookieParser());
app.use(checkAuth);
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/videos', videosRouter);


app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/galery', (req, res) => {
    res.render('galery'); 
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.get('/register', (req, res) => {
    res.render('register'); 
});

app.get('/profile', (req, res) => {
    res.render('profile');
});

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});