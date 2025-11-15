// Archivo: Backend/models/video.js
import { supabase } from '../lib/supabaseClient.js';

class VideoModel {
    static async createVideo({ userId, videoUrl, storagePath, title, exerciseType }) {
        // Usa los nombres de columnas correctos según tu tabla
        const payload = {
            user_id: userId,
            video_route: videoUrl, // ← CORREGIDO: usa video_route en lugar de video_url
            // storage_path no existe en tu tabla, así que lo omitimos
            title: title,
            exercise_type: exerciseType,
            created_at: new Date().toISOString(),
            status: 'active', // Agrega un valor por defecto para status
            analysis: '' // Agrega un valor por defecto para analysis
        };
        
        console.log('Insertando video con payload:', payload);
        
        const { data, error } = await supabase
            .from('video')
            .insert([payload])
            .select()
            .single();
            
        if (error) {
            console.error('Error en VideoModel.createVideo:', error);
            throw error;
        }
        return data;
    }

    static async getVideosByUserId(userId) {
        const { data, error } = await supabase
            .from('video')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    static async getVideoById(id) {
        const { data, error } = await supabase
            .from('video')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    static async deleteVideo(id) {
        const { data, error } = await supabase
            .from('video')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return data;
    }
}

export default VideoModel;