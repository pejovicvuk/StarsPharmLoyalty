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
} from 'react-native';
import { supabase } from '../supabase';

interface ResetPasswordPageProps {
  onResetComplete: () => void;
}

const ResetPasswordPage = ({ onResetComplete }: ResetPasswordPageProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Greška', 'Molimo unesite novu lozinku i potvrdite je');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Greška', 'Lozinke se ne podudaraju');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Uspešno',
        'Vaša lozinka je uspešno promenjena',
        [
          {
            text: 'OK',
            onPress: onResetComplete
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Greška',
        error.message || 'Došlo je do greške prilikom promene lozinke. Pokušajte ponovo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Resetovanje Lozinke</Text>
        <Text style={styles.subtitle}>Unesite vašu novu lozinku</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nova Lozinka</Text>
          <TextInput
            style={styles.input}
            placeholder="Unesite novu lozinku"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Potvrdite Lozinku</Text>
          <TextInput
            style={styles.input}
            placeholder="Potvrdite novu lozinku"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Promeni Lozinku</Text>
          )}
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
  resetButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetPasswordPage; 