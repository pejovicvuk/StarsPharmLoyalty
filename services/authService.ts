import { supabase } from '../supabase';
import { UserModel, ClientModel, PharmacistModel } from '../types/interfaces';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'pharmacist' | 'client';
  } | null;
  error: string | null;
}

interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
}

interface RegisterResponse {
  success: boolean;
  error: string | null;
  requiresConfirmation?: boolean;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Attempting login with:', email);
    
    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return { user: null, error: authError.message };
    }
    
    if (!authData.user) {
      return { user: null, error: 'User not found' };
    }
    
    // Get user data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', authData.user.id)
      .single();
    
    if (userError || !userData) {
      console.error('User data fetch error:', userError);
      return { user: null, error: 'Failed to fetch user data' };
    }
    
    console.log('Login successful for:', userData.email);
    
    // Return user data
    return {
      user: {
        id: userData.id.toString(),
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role as 'pharmacist' | 'client'
      },
      error: null
    };
  } catch (error: any) {
    console.error('Login error:', error.message);
    return { user: null, error: error.message };
  }
};

export const registerUser = async (userData: RegisterUserData): Promise<RegisterResponse> => {
  try {
    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return { success: false, error: 'Email adresa već postoji' };
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'client'
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }
    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Insert into users table
    const { error: userInsertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: userData.email,
      password: '**********',
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: 'client'
    });
    if (userInsertError) {
      throw new Error('Failed to insert user: ' + userInsertError.message);
    }

    // Insert into clients table
    const qrCode = `CLIENT_${authData.user.id}_${Date.now()}`;
    const { error: clientInsertError } = await supabase.from('clients').insert({
      user_id: authData.user.id,
      stars: 0,
      qr_code: qrCode,
      date_of_birth: userData.dateOfBirth ? userData.dateOfBirth.toISOString().split('T')[0] : null,
      gender: userData.gender || '0',
      phone: userData.phone || '0'
    });
    if (clientInsertError) {
      throw new Error('Failed to insert client: ' + clientInsertError.message);
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const fetchClientDetails = async (userId: string): Promise<ClientModel | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching client details:', error);
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception fetching client details:', error.message);
    return null;
  }
};

export const fetchPharmacistDetails = async (userId: string): Promise<PharmacistModel | null> => {
  try {
    const { data, error } = await supabase
      .from('pharmacist')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching pharmacist details:', error);
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception fetching pharmacist details:', error.message);
    return null;
  }
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'starspharmloyalty://reset-password'
    });

    if (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Password reset exception:', error);
    return { success: false, error: error.message };
  }
};

// Add new function to resend confirmation email
export const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: 'starspharmloyalty://confirm-email'
      }
    });

    if (error) {
      console.error('Resend confirmation email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Resend confirmation email exception:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Delete from clients table
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('user_id', userId);
    if (clientError) throw clientError;

    // 2. Delete from users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (userError) throw userError;

    // 3. Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message };
  }
};

export const createUserProfileIfNeeded = async (user: any, metadata: any) => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      const { error: userInsertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        password: '**********',
        first_name: metadata.first_name || user.user_metadata?.first_name,
        last_name: metadata.last_name || user.user_metadata?.last_name,
        role: metadata.role || user.user_metadata?.role || 'client'
      });

      if (userInsertError) throw userInsertError;

      if (metadata.role === 'client' || user.user_metadata?.role === 'client') {
        const qrCode = `CLIENT_${user.id}_${Date.now()}`;
        const { error: clientInsertError } = await supabase.from('clients').insert({
          user_id: user.id,
          stars: 0,
          qr_code: qrCode
        });
        if (clientInsertError) throw clientInsertError;
      }
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}; 