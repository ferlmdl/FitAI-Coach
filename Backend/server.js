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
        console.log('Conexión a Supabase exitosa. Datos:', data);
    }
}

testSupabaseConnection();

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        layoutsDir: path.join(__dirname, 'views/layouts'),
        partialsDir: path.join(__dirname, 'views/partials'),
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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkAuth);
app.use(express.static(path.join(__dirname, '../Frontend')));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/videos', videosRouter);

app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/galery', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = res.locals.user.id;

    const { data: videos, error } = await supabase
        .from('video')
        .select('*')
        .eq('user_id', userId) 
        .order('created_at', { ascending: false }); 

    if (error) {
        console.error('Error al buscar videos:', error);
        return res.status(500).send('Error al cargar la galería.');
    }

    res.render('galery', {
        videos: videos,
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        pageCss: 'styleLog.css'
    }); 
});

app.get('/recovery', (req, res) => {
    res.render('recovery', {
        pageCss: 'styleLog.css'
    }); 
});

app.get('/register', (req, res) => {
    res.render('register',{
        pageCss: 'styleReg.css'
    }); 
});

app.get('/analysis/:id', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }

    const videoId = req.params.id;

    const { data: videoData, error } = await supabase
        .from('video') 
        .select('*')
        .eq('id', videoId)
        .single();

    if (error || !videoData) {
        console.error('Error al buscar el video:', error);
        return res.render('analysis', {
            error: 'No se encontró un video con ese ID.'
        });
    }

    res.render('analysis', {
        analysis: videoData,
        pageCss: 'styleAnalysis.css'
    });
});

app.get('/profile', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }

    const userId = res.locals.user.id;

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(); 

    if (profileError) {
        console.error('Error al buscar el perfil:', profileError);
        return res.status(500).send('Error al cargar el perfil.');
    }

    const { count: videoCount, error: countError } = await supabase
        .from('video')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId); 

    const createdAtDate = new Date(profileData.created_at);
    const currentDate = new Date();
    const yearDiff = currentDate.getFullYear() - createdAtDate.getFullYear();
    const monthDiff = currentDate.getMonth() - createdAtDate.getMonth();
    const monthsActive = Math.max(0, yearDiff * 12 + monthDiff);

    res.render('profile', {
        profile: profileData,
        videoCount: videoCount || 0,
        monthsActive: monthsActive,
        pageCss: 'stylePerfil.css'
    });
});

app.get('/upload', (req, res) => {
    res.render('upload', {
        pageCss: 'styleSub.css'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

export default app;