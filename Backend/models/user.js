import { supabase } from '../lib/supabaseClient.js';

class UserModel {
    static async createUser({ email, password, userName, allName }) {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    userName: userName,
                    allName: allName
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
}

export default UserModel;