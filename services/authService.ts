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
  dateOfBirth: Date;
  gender: string;
  phone: string;
}

interface RegisterResponse {
  success: boolean;
  error: string | null;
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
    
    if (userError) {
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
    console.log('Starting registration process for:', userData.email);
    
    // 1. Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'client' // Default role is client
        }
      }
    });
    
    if (authError) {
      console.error('Auth registration error:', authError);
      throw new Error(authError.message);
    }
    
    if (!authData.user) {
      throw new Error('Failed to create user account');
    }
    
    console.log('Auth user created:', authData.user.id);
    
    // 2. Insert user record in users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id, // Use the auth user ID
          email: userData.email,
          password: '**********', // Store a placeholder since auth handles passwords
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'client'
        }
      ])
      .select('id')
      .single();
    
    if (userError) {
      console.error('User insert error:', userError);
      // Try to clean up the auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Error creating user in database');
    }
    
    // 3. Generate a unique QR code
    const qrCode = `CLIENT_${authData.user.id}_${Date.now()}`;
    
    // 4. Insert client details with date_of_birth instead of age
    const { error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          user_id: authData.user.id,
          stars: 0,
          qr_code: qrCode,
          date_of_birth: userData.dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
          gender: userData.gender,
          phone: userData.phone
        }
      ]);
    
    if (clientError) {
      console.error('Client insert error:', clientError);
      // Clean up if client creation fails
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Error creating client profile');
    }
    
    console.log('Registration successful for:', userData.email);
    return { success: true, error: null };
    
  } catch (error: any) {
    console.error('Registration process error:', error);
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