import { supabase } from '../lib/supabaseClient.js';

class UserModel {

  static async createUser({ email, password, userName, allName, age }) {
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          userName: userName,
          allName: allName,
          age: age
        }
      }
    });
    if (error) throw error;
    return user;
  }

  static async getUserById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .single(); 
    if (error) throw error;
    return data;
  }

  static async deleteUser(id) {
    const { data: authData, error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Error al eliminar usuario de Supabase Auth:', authError);
      throw new Error('Error al eliminar el usuario de autenticación.');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Error al eliminar el perfil (auth user fue eliminado):', profileError);
    }

    return authData;
  }

  static async toggleFavorite(userId, videoId) {
    const { data: existingLike, error: checkError } = await supabase
      .from('video_favorites')
      .select('user_id') 
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError; 
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('video_favorites')
        .delete()
        .match({ user_id: userId, video_id: videoId });

      if (deleteError) throw deleteError;
      return { status: 'removed', favorited: false };

    } else {
      const { error: insertError } = await supabase
        .from('video_favorites')
        .insert({ user_id: userId, video_id: videoId });
      
      if (insertError) throw insertError;
      return { status: 'added', favorited: true };
    }
  }

  static async getFavoriteVideoIds(userId) {
    const { data, error } = await supabase
      .from('video_favorites')
      .select('video_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(fav => fav.video_id);
  }
}

export default UserModel;