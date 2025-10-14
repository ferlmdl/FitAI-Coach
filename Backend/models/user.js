import supabase from '../lib/supabaseClient.js';

class UserModel {
    static async createUser({ email, password, username }) {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        if (error) throw error;
        return user;
    }

    static async getUserById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    static async updateUser(id, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    static async deleteUser(id) {
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
}

export default UserModel;