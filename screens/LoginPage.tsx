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
} from 'react-native';

interface User {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  token: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// Mock users for login
const mockUsers = [
  {
    email: 'klijent',
    password: '',
    userId: '1',
    name: 'Ana',
    surname: 'Marković',
    role: 'client',
    token: 'mock-token-client'
  },
  {
    email: 'farmaceut',
    password: '',
    userId: '2',
    name: 'Marko',
    surname: 'Petrović',
    role: 'pharmacist',
    token: 'mock-token-pharmacist'
  }
];

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email === email && u.password === password
      );
      
      if (user) {
        // Add console.log to debug
        console.log("Login successful:", user);
        const { password, ...userInfo } = user;
        onLogin(userInfo as User);
      } else {
        // Add console.log to debug
        console.log("Login failed. Email:", email, "Password:", password);
        Alert.alert(
          "Prijava neuspešna", 
          "Pogrešan email ili lozinka. Pokušajte ponovo.",
          [{ text: "U redu" }]
        );
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          {/* Using the StarsPharm logo image */}
          <Image 
            source={require('../assets/starsPharmLogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Dobrodošli u StarsPharm Loyalty</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Lozinka"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Prijavljivanje...' : 'Prijavi se'}
            </Text>
          </TouchableOpacity>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Zaboravili ste lozinku?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.demoCredentials}>
          <Text style={styles.demoTitle}>Demo kredencijali:</Text>
          <Text style={styles.demoText}>Klijent: klijent@example.com / password123</Text>
          <Text style={styles.demoText}>Farmaceut: farmaceut@example.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8BC8A3',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#8BC8A3', // Light green from the StarsPharm logo
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#8BC8A3',
    fontSize: 16,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#8BC8A3',
    fontSize: 14,
  },
  demoCredentials: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(139, 200, 163, 0.1)',
    borderRadius: 8,
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#8BC8A3',
  },
  demoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default LoginPage; 