import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../components/Header';
import { supabase } from '../../supabase';
import { ClientModel } from '../../types/interfaces';

interface ProfileSettingsProps {
  clientDetails: ClientModel;
  onBack: () => void;
  onUpdate: () => void;
}

const ProfileSettings = ({ clientDetails, onBack, onUpdate }: ProfileSettingsProps) => {
  const [phone, setPhone] = useState(clientDetails.phone);
  const [gender, setGender] = useState(clientDetails.gender);
  const [dateOfBirth, setDateOfBirth] = useState(new Date(clientDetails.date_of_birth));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const formatDate = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}.`;
  };

  const formatPhoneNumber = (input: string) => {
    let digits = input.replace(/\D/g, '');
    if (!digits.startsWith('381')) {
      digits = '381' + digits;
    }
    return '+' + digits.replace(/(\d{3})(\d{2})(\d{6})/, '$1 $2 $3');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          phone: phone,
          gender: gender,
          date_of_birth: dateOfBirth.toISOString(),
        })
        .eq('id', clientDetails.id);

      if (error) throw error;

      Alert.alert('Uspeh', 'Vaši podaci su uspešno ažurirani.');
      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Greška', 'Došlo je do greške prilikom ažuriranja podataka.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Podešavanja Profila"
        rightButtonText="Nazad"
        rightButtonAction={onBack}
      />
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Telefon</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phonePrefix}>+381</Text>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={phone.replace('+381', '')}
              onChangeText={(text) => setPhone(formatPhoneNumber(text))}
              placeholder="6X XXXXXX"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pol</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={styles.pickerValue}>{gender || 'Izaberite pol'}</Text>
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
                <Picker.Item label="Muški" value="muški" />
                <Picker.Item label="Ženski" value="ženski" />
              </Picker>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Datum Rođenja</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatDate(dateOfBirth)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Sačuvaj Promene</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
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
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  phonePrefix: {
    paddingLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 0,
    backgroundColor: 'transparent',
  },
});

export default ProfileSettings; 