import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import LoginPage from './screens/LoginPage';
import RegisterPage from './screens/RegisterPage';
import ResetPasswordPage from './screens/ResetPasswordPage';
import ClientHome from './screens/Client/ClientHome';
import PharmacistHome from './screens/Pharmacist/PharmacistHome';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import * as Linking from 'expo-linking';

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
  const [showResetPassword, setShowResetPassword] = useState(false);

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

    // Set up deep linking
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const handleDeepLink = async (event: { url: string }) => {
    const url = event.url;
    if (url.includes('reset-password')) {
      // Parse tokens from the URL fragment/hash
      const hash = url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
        }
      }
      setShowResetPassword(true);
    }
  };

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

  const handleResetComplete = () => {
    setShowResetPassword(false);
  };

  if (showResetPassword) {
    return (
      <View style={styles.container}>
        <ResetPasswordPage onResetComplete={handleResetComplete} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (showRegister) {
    return (
      <View style={styles.container}>
        <RegisterPage
          onRegisterSuccess={handleNavigateToLogin}
          onBackToLogin={handleNavigateToLogin}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        {user.role === 'client' ? (
          <ClientHome user={user} onLogout={handleLogout} />
        ) : (
          <PharmacistHome user={user} onLogout={handleLogout} />
        )}
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoginPage onLogin={setUser} onRegister={handleNavigateToRegister} />
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