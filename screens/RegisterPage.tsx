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
import Checkbox from 'expo-checkbox';

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
  const [agreesToTerms, setAgreesToTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Add new state for temporary date selection
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));

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
    
    if (!agreesToTerms) {
      Alert.alert('Greška', 'Morate prihvatiti uslove korišćenja da biste nastavili.');
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
      if (error.message.includes('Email address') && error.message.includes('invalid')) {
        setError('Email adresa nije validna. Molimo unesite postojeću email adresu.');
      } else {
        setError('Došlo je do greške pri registraciji. Pokušajte ponovo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}.`;
  };

  // Add phone number formatting
  const formatPhoneNumber = (input: string) => {
    // Remove any non-digit characters
    let digits = input.replace(/\D/g, '');
    
    // If the number doesn't start with +381, add it
    if (!digits.startsWith('381')) {
      digits = '381' + digits;
    }
    
    // Format as +381 XX XXXXXX
    return '+' + digits.replace(/(\d{3})(\d{2})(\d{6})/, '$1 $2 $3');
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
              <Text style={styles.passwordHint}>(najmanje 6 znakova)</Text>
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
                <View style={styles.datePickerContainer}>
                  {Platform.OS === 'ios' && (
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity 
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerButtonText}>Otkaži</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          setDateOfBirth(tempDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[styles.datePickerButtonText, styles.confirmButton]}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={Platform.OS === 'ios' ? tempDate : dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDateOfBirth(selectedDate);
                        }
                      } else {
                        if (selectedDate) {
                          setTempDate(selectedDate);
                        }
                      }
                    }}
                    maximumDate={new Date()}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pol</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={gender ? styles.pickerValue : styles.pickerPlaceholder}>
                  {gender || 'Izaberite pol'}
                </Text>
              </TouchableOpacity>
              
              {showGenderPicker && (
                <View style={styles.modalContainer}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => {
                      setGender(itemValue);
                      setShowGenderPicker(false);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Izaberite pol" value="" />
                    <Picker.Item label="Muški" value="muški" />
                    <Picker.Item label="Ženski" value="ženski" />
                  </Picker>
                </View>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+381</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="6X XXXXXX"
                  value={phone.replace('+381', '')}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.termsContainer}>
            <Checkbox
              value={agreesToTerms}
              onValueChange={setAgreesToTerms}
              color={agreesToTerms ? '#4A9B7F' : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.termsText}>
              Saglasan/na sam da primam obaveštenja o promotivnim akcijama, 
              podsetnicima za preuzimanje lekova i drugim relevantnim informacijama 
              putem dostavljenih kontakt podataka, u skladu sa Zakonom o zaštiti 
              podataka o ličnosti.
            </Text>
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
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  picker: {
    height: 200,
    backgroundColor: 'white',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  phonePrefix: {
    paddingLeft: 12,
    paddingRight: 4,
    color: '#666666',
    fontSize: 16,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
  },
  passwordHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginLeft: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#E8E8E8',
    zIndex: 1000,
    maxHeight: 200,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 1000,
    borderTopWidth: 1,
    borderColor: '#E8E8E8',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#8BC8A3',
    paddingHorizontal: 10,
  },
  confirmButton: {
    fontWeight: '600',
  },
});

export default RegisterPage;
