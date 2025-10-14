import { supabase } from '../lib/supabaseClient.js';

class video {
    static async createVideo({ userId, videoUrl, title, exerciseType }) {
        const { data, error } = await supabase
            .from('videos')
            .insert({
                user_id: userId,
                video_url: videoUrl,
                title,
                exercise_type: exerciseType,
                status: 'uploaded'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getVideoById(id) {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async getVideosByUserId(userId) {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    static async updateVideo(id, updates) {
        const { data, error } = await supabase
            .from('videos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteVideo(id) {
        const { data, error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
}

export default video;