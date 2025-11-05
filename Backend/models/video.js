// Archivo: Backend/models/video.js
import { supabase } from '../lib/supabaseClient.js';

class VideoModel {
    static async createVideo({ userId, videoUrl, title, exerciseType }) {
        const { data, error } = await supabase
            .from('video')
            .insert({
                user_id: userId,
                video_route: videoUrl,
                title: title,
                exercise_type: exerciseType,
                status: 'uploaded', // <-- Asegura que el status se guarde
                analysis: null      // <-- Pone 'analysis' como nulo por ahora
            })
            .select()
            .single();
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

    static async getVideosByUserId(userId) {
        const { data, error } = await supabase
            .from('video')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    static async updateVideo(id, updates) {
        const { data, error } = await supabase
            .from('video')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteVideo(id) {
        const { data, error } = await supabase
            .from('video')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default VideoModel;