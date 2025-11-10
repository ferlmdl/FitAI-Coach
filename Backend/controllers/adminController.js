import { supabase } from '../lib/supabaseClient.js';

// --- NUEVA FUNCIÓN AYUDANTE PARA LIMPIAR NOMBRES DE ARCHIVO ---
const sanitizeFilename = (filename) => {
  return filename
    .normalize("NFD") // (1) Separa acentos (ej: 'ó' -> 'o' + '´')
    .replace(/[\u0300-\u036f]/g, "") // (2) Quita los acentos
    .replace(/\s+/g, '_') // (3) Reemplaza espacios con guiones bajos
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // (4) Quita cualquier caracter raro
};
// -----------------------------------------------------------

export const handleUploadExercise = async (req, res) => {
  // 1. Pista de inicio
  console.log("\n--- ADMIN: Subida de ejercicio INICIADA ---");

  try {
    const { nombre_video, grupo_muscular, descripcion } = req.body;
    console.log("ADMIN: Datos de texto recibidos:", { nombre_video, grupo_muscular });

    // 2. Pista de archivos
    if (!req.files || !req.files.videoFile || !req.files.imageFile) {
      console.error("ADMIN ERROR: ¡No se encontraron archivos en req.files!");
      return res.status(400).json({ success: false, error: 'Se requieren un archivo de video y una imagen.' });
    }
    console.log("ADMIN: Archivos recibidos correctamente.");

    const videoFile = req.files.videoFile[0];
    const imageFile = req.files.imageFile[0];

    // --- ★★★ CORRECCIÓN: USAMOS LA FUNCIÓN DE LIMPIEZA ★★★ ---
    const cleanVideoName = sanitizeFilename(videoFile.originalname);
    const cleanImageName = sanitizeFilename(imageFile.originalname);
    // -------------------------------------------------------

    const videoFileName = `public/videos/${Date.now()}_${cleanVideoName}`;
    const imageFileName = `public/images/${Date.now()}_${cleanImageName}`;

    // 3. Pista antes de subir video
    console.log(`ADMIN: Subiendo video a bucket 'videos_web' como: ${videoFileName}`); // Ahora mostrará el nombre limpio
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from('videos_web')
      .upload(videoFileName, videoFile.buffer, {
        contentType: videoFile.mimetype,
        upsert: false
      });
    if (videoError) throw videoError; 
    console.log("ADMIN: Video subido a Storage con éxito.");

    // 4. Pista antes de subir imagen
    console.log(`ADMIN: Subiendo imagen a bucket 'videos_web' como: ${imageFileName}`); // Ahora mostrará el nombre limpio
    const { data: imageUpload, error: imageError } = await supabase.storage
      .from('videos_web')
      .upload(imageFileName, imageFile.buffer, {
        contentType: imageFile.mimetype,
        upsert: false
      });
    if (imageError) throw imageError;
    console.log("ADMIN: Imagen subida a Storage con éxito.");

    // 5. Pista antes de obtener URLs
    console.log("ADMIN: Obteniendo URLs públicas...");
    const { data: videoUrlData } = supabase.storage.from('videos_web').getPublicUrl(videoUpload.path);
    const { data: imageUrlData } = supabase.storage.from('videos_web').getPublicUrl(imageUpload.path);
    console.log("ADMIN: URLs obtenidas:", videoUrlData.publicUrl, imageUrlData.publicUrl);

    // 6. Pista antes de insertar en la base de datos
    console.log("ADMIN: Insertando datos en la tabla 'videos_web' de la BD...");
    const { data: newExercise, error: insertError } = await supabase
      .from('videos_web')
      .insert({
        nombre_video: nombre_video,
        grupo_muscular: grupo_muscular,
        descripcion: descripcion,
        ruta_video: videoUrlData.publicUrl,
        ruta_imagen: imageUrlData.publicUrl
      })
      .select()
      .single();

    if (insertError) throw insertError; 
    console.log("ADMIN: ¡Fila insertada en la BD con éxito!");

    // 7. Pista final
    console.log("--- ADMIN: Proceso completado. Enviando respuesta 201. ---\n");
    res.status(201).json({ success: true, message: 'Ejercicio subido exitosamente', data: newExercise });

  } catch (error) {
    // 8. Pista de error
    console.error("\n--- ¡ADMIN: ERROR CAPTURADO! ---");
    console.error(error);
    console.error("----------------------------------\n");
    res.status(500).json({ success: false, error: 'Error en el servidor al subir el ejercicio.', details: error.message });
  }
};