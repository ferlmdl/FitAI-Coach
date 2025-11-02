import supabase from '../lib/supabaseClient.js';

class UserModel {
    static async createUser({ email, password, userName, allName }) {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { userName: userName,
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
        const { data, error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
}

export default UserModel;