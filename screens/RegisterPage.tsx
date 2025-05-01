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
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerUser } from '../services/authService';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

const RegisterPage = ({ onRegisterSuccess, onBackToLogin }: RegisterPageProps) => {
  // User information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Client information
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1)); // Default to Jan 1, 2000
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateInputs = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !dateOfBirth || !gender || !phone) {
      setError('Molimo popunite sva polja');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Lozinke se ne podudaraju');
      return false;
    }
    
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return false;
    }
    
    // Validate date of birth (must be in the past and not too far in the past)
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120); // Max age 120 years
    
    if (dateOfBirth > today || dateOfBirth < minDate) {
      setError('Unesite validan datum rođenja');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Unesite validnu email adresu');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    console.log('Register button clicked');
    
    if (!validateInputs()) {
      console.log('Validation failed:', error);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Calling registerUser service...');
      const { success, error: registrationError } = await registerUser({
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        gender,
        phone
      });
      
      if (!success) {
        throw new Error(registrationError || 'Registration failed');
      }
      
      Alert.alert(
        'Uspešna Registracija',
        'Vaš nalog je uspešno kreiran. Proverite email za verifikaciju, pa se prijavite.',
        [{ text: 'OK', onPress: onRegisterSuccess }]
      );
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Došlo je do greške pri registraciji');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}.`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Registracija</Text>
          <Text style={styles.subtitle}>Kreirajte vaš Stars Pharm nalog</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lični Podaci</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ime</Text>
              <TextInput
                style={styles.input}
                placeholder="Unesite vaše ime"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Prezime</Text>
              <TextInput
                style={styles.input}
                placeholder="Unesite vaše prezime"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            
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
                placeholder="Kreirajte lozinku"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Potvrdite Lozinku</Text>
              <TextInput
                style={styles.input}
                placeholder="Ponovite lozinku"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dodatne Informacije</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Datum Rođenja</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{formatDate(dateOfBirth)}</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={dateOfBirth}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pol</Text>
              <TextInput
                style={styles.input}
                placeholder="Unesite vaš pol (Muški/Ženski)"
                value={gender}
                onChangeText={setGender}
              />
            </View>
            
            <View style={[styles.inputContainer, { marginTop: 10 }]}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                placeholder="Unesite vaš broj telefona"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Registruj se</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToLogin}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Već imate nalog? Prijavite se</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
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
    marginBottom: 20,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A9B7F',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
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
  registerButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#8BC8A3',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
  },
});

export default RegisterPage;
