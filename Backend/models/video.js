// Archivo: Backend/models/video.js
import { supabase } from '../lib/supabaseClient.js';

class VideoModel {
    static async createVideo({ userId, videoUrl, storagePath, title, exerciseType }) {
        // Ajusta los nombres de columnas según tu tabla en supabase
        const payload = {
            user_id: userId,
            video_url: videoUrl,
            storage_path: storagePath,
            title,
            exercise_type: exerciseType,
            created_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('video')
            .insert([payload])
            .select()
            .single();
        if (error) throw error;
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