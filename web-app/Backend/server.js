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
import adminRouter from './routes/admin.js';  


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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(checkAuth);
app.use(express.static(path.join(__dirname, '../Frontend')));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/videos', videosRouter);
app.use('/api/admin', adminRouter);

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

app.get('/verificacion-exitosa', (req, res) => {
    res.render('verificacion-exitosa', { pageCss: 'styleLog.css' });
});

app.get('/update-password', (req, res) => {
    res.render('update-password', { pageCss: 'styleLog.css' });
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

app.get('/videos', async (req, res) => {
  if (!res.locals.isLoggedIn) {
    return res.redirect('/login');
  }

  try {
    const userId = res.locals.user.id;
    const { data: userData, error: profileError } = await supabase
      .from('profiles')
      .select('userName, role') 
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { data: allVideos, error: videosError } = await supabase
      .from('videos_web')
      .select('*')
      .order('nombre_video', { ascending: true });
    
    if (videosError) throw videosError;

    const { data: favoriteData, error: favoritesError } = await supabase
      .from('video_favorites')
      .select('video_id')
      .eq('user_id', userId);

    if (favoritesError) throw favoritesError;

    const favoriteIds = new Set(favoriteData.map(fav => fav.video_id));

    const processedVideos = allVideos.map(video => ({
      ...video,
      isFavorited: favoriteIds.has(video.id)
    }));

    res.render('videos', {
      videos: processedVideos,
      user: { userName: userData.userName },
      
      isAdmin: userData.role?.toLowerCase() === 'admin',

      pageCss: 'style.css' 
    });

  } catch (error) {
    console.error('Error al cargar la biblioteca de videos:', error);
    res.status(500).send('Error al cargar la biblioteca de videos.');
  }
});

app.get('/upload', (req, res) => {
  res.render('upload', {
    pageCss: 'styleSub.css'
  });
});

app.get('/api/video-status/:id', async (req, res) => {
  if (!res.locals.isLoggedIn) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  const { data, error } = await supabase
    .from('video')
    .select('analysis, status')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

export default app;
