import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import LoginPage from './screens/LoginPage';
import RegisterPage from './screens/RegisterPage';
import ClientHome from './screens/Client/ClientHome';
import PharmacistHome from './screens/Pharmacist/PharmacistHome';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Define the User type
interface User {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSessionUser(session);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionUser = async (session: Session | null) => {
    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setUser({
          userId: userData.id,
          email: userData.email,
          name: userData.first_name,
          surname: userData.last_name,
          role: userData.role
        });
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleNavigateToRegister = () => {
    setShowRegister(true);
  };

  const handleNavigateToLogin = () => {
    setShowRegister(false);
  };

  return (
    <View style={styles.container}>
      {user ? (
        // Render the appropriate screen based on user role
        user.role === 'client' ? (
          <ClientHome user={user} onLogout={handleLogout} />
        ) : (
          <PharmacistHome user={user} onLogout={handleLogout} />
        )
      ) : (
        // If no user is logged in, show either login or register page
        showRegister ? (
          <RegisterPage 
            onRegisterSuccess={handleNavigateToLogin} 
            onBackToLogin={handleNavigateToLogin} 
          />
        ) : (
          <LoginPage 
            onLogin={setUser} 
            onRegister={handleNavigateToRegister} 
          />
        )
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});