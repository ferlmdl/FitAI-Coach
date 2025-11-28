import { supabase } from '../lib/supabaseClient.js';

class VideoModel {
    static async createVideo(videoData) {
        
        const payload = {
            ...videoData,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('video')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error("Error SUbabase Insert:", error);
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