import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { loginUser, requestPasswordReset } from '../services/authService';
import { supabase } from '../supabase';

interface User {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
  onRegister: () => void;
}

const LoginPage = ({ onLogin, onRegister }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Greška', 'Molimo unesite email i lozinku');
      return;
    }

    setIsLoading(true);
    setDebugInfo('Attempting login...');

    try {
      setDebugInfo(`Logging in with: ${email}`);
      const { user, error } = await loginUser(email, password);
      
      if (error || !user) {
        setDebugInfo(`Login failed: ${error}`);
        Alert.alert(
          'Prijava neuspešna',
          error || 'Pogrešan email ili lozinka. Pokušajte ponovo.'
        );
        setIsLoading(false);
        return;
      }
      
      setDebugInfo('Login successful, fetching user data');
      // Fetch user data from users table
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('id', user.id)
        .single();
      if (!userData || userFetchError) {
        setDebugInfo('User data fetch failed');
        Alert.alert('Greška', 'Došlo je do greške prilikom prijave. Pokušajte ponovo.');
        setIsLoading(false);
        return;
      }
      setDebugInfo('User data ready, mapping user data');
      // Map the user data to your app's User interface
      const appUser: User = {
        userId: userData.id,
        email: userData.email,
        name: userData.first_name,
        surname: userData.last_name,
        role: userData.role,
      };
      setDebugInfo(`User mapped: ${appUser.name} ${appUser.surname}`);
      onLogin(appUser);
    } catch (error: any) {
      setDebugInfo(`Exception: ${error.message}`);
      Alert.alert(
        'Prijava neuspešna',
        'Došlo je do greške prilikom prijave. Pokušajte ponovo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Greška', 'Molimo unesite vaš email adresu');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { success, error } = await requestPasswordReset(email);
      
      if (success) {
        Alert.alert(
          'Email poslat',
          'Poslali smo vam email sa uputstvima za resetovanje lozinke. Molimo proverite vašu email poštu.'
        );
      } else {
        Alert.alert(
          'Greška',
          error || 'Došlo je do greške prilikom slanja email-a. Pokušajte ponovo.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Greška',
        'Došlo je do greške prilikom slanja email-a. Pokušajte ponovo.'
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/starsPharmLogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Dobrodošli u Stars Pharm</Text>
        <Text style={styles.subtitle}>Prijavite se na vaš nalog</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Unesite vaš email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Lozinka</Text>
          <TextInput
            style={styles.input}
            placeholder="Unesite vašu lozinku"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Prijavi se</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
          disabled={isResettingPassword}
        >
          {isResettingPassword ? (
            <ActivityIndicator color="#8BC8A3" />
          ) : (
            <Text style={styles.forgotPasswordText}>Zaboravili ste lozinku?</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={onRegister}
        >
          <Text style={styles.registerButtonText}>Nemate nalog? Registrujte se</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#8BC8A3',
    fontSize: 14,
  },
  registerButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#8BC8A3',
    fontSize: 14,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
  }
});

export default LoginPage; 