import { supabase } from '../lib/supabaseClient.js';

const sanitizeFilename = (filename) => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, ''); 
};

export const handleUploadExercise = async (req, res) => {
  console.log("\n--- ADMIN: Subida de ejercicio INICIADA ---");

  try {
    const { nombre_video, grupo_muscular, descripcion } = req.body;
    console.log("ADMIN: Datos de texto recibidos:", { nombre_video, grupo_muscular });

    if (!req.files || !req.files.videoFile || !req.files.imageFile) {
      console.error("ADMIN ERROR: ¡No se encontraron archivos en req.files!");
      return res.status(400).json({ success: false, error: 'Se requieren un archivo de video y una imagen.' });
    }
    console.log("ADMIN: Archivos recibidos correctamente.");

    const videoFile = req.files.videoFile[0];
    const imageFile = req.files.imageFile[0];

    const cleanVideoName = sanitizeFilename(videoFile.originalname);
    const cleanImageName = sanitizeFilename(imageFile.originalname);

    const videoFileName = `public/videos/${Date.now()}_${cleanVideoName}`;
    const imageFileName = `public/images/${Date.now()}_${cleanImageName}`;

    console.log(`ADMIN: Subiendo video a bucket 'videos_web' como: ${videoFileName}`); // Ahora mostrará el nombre limpio
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from('videos_web')
      .upload(videoFileName, videoFile.buffer, {
        contentType: videoFile.mimetype,
        upsert: false
      });
    if (videoError) throw videoError; 
    console.log("ADMIN: Video subido a Storage con éxito.");

    console.log(`ADMIN: Subiendo imagen a bucket 'videos_web' como: ${imageFileName}`); // Ahora mostrará el nombre limpio
    const { data: imageUpload, error: imageError } = await supabase.storage
      .from('videos_web')
      .upload(imageFileName, imageFile.buffer, {
        contentType: imageFile.mimetype,
        upsert: false
      });
    if (imageError) throw imageError;
    console.log("ADMIN: Imagen subida a Storage con éxito.");

    console.log("ADMIN: Obteniendo URLs públicas...");
    const { data: videoUrlData } = supabase.storage.from('videos_web').getPublicUrl(videoUpload.path);
    const { data: imageUrlData } = supabase.storage.from('videos_web').getPublicUrl(imageUpload.path);
    console.log("ADMIN: URLs obtenidas:", videoUrlData.publicUrl, imageUrlData.publicUrl);

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

    console.log("--- ADMIN: Proceso completado. Enviando respuesta 201. ---\n");
    res.status(201).json({ success: true, message: 'Ejercicio subido exitosamente', data: newExercise });

  } catch (error) {
    console.error("\n--- ¡ADMIN: ERROR CAPTURADO! ---");
    console.error(error);
    console.error("----------------------------------\n");
    res.status(500).json({ success: false, error: 'Error en el servidor al subir el ejercicio.', details: error.message });
  }
};