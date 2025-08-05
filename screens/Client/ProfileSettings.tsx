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
  Modal,
  Platform,
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
  onLogout: () => void;
  starsCount?: number;
}

const ProfileSettings = ({ clientDetails, onBack, onUpdate, onLogout, starsCount }: ProfileSettingsProps) => {
  const [phone, setPhone] = useState(clientDetails.phone === '0' ? '' : clientDetails.phone);
  const [dateOfBirth, setDateOfBirth] = useState(new Date(clientDetails.date_of_birth));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(clientDetails.date_of_birth));
  const [isDeleting, setIsDeleting] = useState(false);
  const [gender, setGender] = useState(clientDetails.gender === '0' ? '' : clientDetails.gender);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Add new state for Android date picker
  const [datePickerStep, setDatePickerStep] = useState<'year' | 'month' | 'day'>('year');
  const [hasSelectedDate, setHasSelectedDate] = useState(true); // Already has a date
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
          date_of_birth: dateOfBirth.toISOString(),
          gender: gender
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Brisanje naloga',
      'Da li ste sigurni da želite da obrišete svoj nalog? Ova akcija je trajna i ne može se opozvati.',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const accessToken = session?.access_token;

              const response = await fetch('https://guibotgxlnyyclmytytv.functions.supabase.co/delete-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ userId: clientDetails.user_id.toString() })
              });
              const result = await response.json();
              console.log('Delete user response:', result);
              console.log('HTTP status:', response.status);
              if (result.success) {
                Alert.alert('Nalog obrisan', 'Vaš nalog je uspešno obrisan.', [
                  {
                    text: 'OK',
                    onPress: onLogout
                  }
                ]);
              } else {
                Alert.alert('Greška', result.error || 'Došlo je do greške prilikom brisanja naloga.');
              }
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Greška', error.message || 'Došlo je do greške prilikom brisanja naloga.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  return (
    <View style={styles.container}>
      <Header
        title="Podešavanja Profila"
        showBackButton={true}
        onBackPress={onBack}
        starsCount={starsCount}
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
              placeholder="Unesite broj telefona"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Datum Rođenja</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setShowDatePicker(true);
              setSelectedYear(null);
              setSelectedMonth(null);
              setSelectedDay(null);
              setDatePickerStep('year');
            }}
          >
            <Text style={hasSelectedDate ? styles.pickerValue : styles.pickerPlaceholder}>
              {hasSelectedDate ? formatDate(dateOfBirth) : 'Unesite datum rođenja'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showDatePicker}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerButtonText}>Otkaži</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          setDateOfBirth(tempDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[styles.datePickerButtonText, styles.confirmButton]}>Potvrdi</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setTempDate(selectedDate);
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showDatePicker}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.simpleDatePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerButtonText}>Otkaži</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.simplePickerContent}>
                      <Text style={styles.simplePickerTitle}>
                        {datePickerStep === 'year' && 'Izaberite godinu rođenja'}
                        {datePickerStep === 'month' && 'Izaberite mesec rođenja'}
                        {datePickerStep === 'day' && 'Izaberite dan rođenja'}
                      </Text>
                      
                      {datePickerStep === 'year' && (
                        <View style={styles.stepPickerContainer}>
                          <ScrollView 
                            style={styles.stepPickerScroll} 
                            showsVerticalScrollIndicator={false}
                          >
                            {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <TouchableOpacity
                                key={year}
                                style={[
                                  styles.stepPickerItem,
                                  selectedYear === year && styles.stepPickerItemSelected
                                ]}
                                onPress={() => {
                                  setSelectedYear(year);
                                  const newDate = new Date(1990, 0, 1);
                                  newDate.setFullYear(year);
                                  setTempDate(newDate);
                                  setDatePickerStep('month');
                                  setHasSelectedDate(true);
                                }}
                              >
                                <Text style={[
                                  styles.stepPickerItemText,
                                  selectedYear === year && styles.stepPickerItemTextSelected
                                ]}>
                                  {year}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      
                      {datePickerStep === 'month' && (
                        <View style={styles.stepPickerContainer}>
                          <ScrollView style={styles.stepPickerScroll} showsVerticalScrollIndicator={false}>
                            {[
                              'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
                              'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                            ].map((month, index) => (
                              <TouchableOpacity
                                key={month}
                                style={[
                                  styles.stepPickerItem,
                                  selectedMonth === index && styles.stepPickerItemSelected
                                ]}
                                onPress={() => {
                                  setSelectedMonth(index);
                                  const newDate = new Date(tempDate);
                                  newDate.setMonth(index);
                                  setTempDate(newDate);
                                  setDatePickerStep('day');
                                }}
                              >
                                <Text style={[
                                  styles.stepPickerItemText,
                                  selectedMonth === index && styles.stepPickerItemTextSelected
                                ]}>
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      
                      {datePickerStep === 'day' && (
                        <View style={styles.stepPickerContainer}>
                          <View style={styles.dayGridContainer}>
                            {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                              <TouchableOpacity
                                key={day}
                                style={[
                                  styles.dayGridItem,
                                  selectedDay === day && styles.dayGridItemSelected
                                ]}
                                onPress={() => {
                                  setSelectedDay(day);
                                  const newDate = new Date(tempDate);
                                  newDate.setDate(day);
                                  setTempDate(newDate);
                                  setDateOfBirth(newDate);
                                  setHasSelectedDate(true);
                                  setShowDatePicker(false);
                                  // Reset all selection states for next use
                                  setSelectedYear(null);
                                  setSelectedMonth(null);
                                  setSelectedDay(null);
                                  setDatePickerStep('year');
                                }}
                              >
                                <Text style={[
                                  styles.dayGridItemText,
                                  selectedDay === day && styles.dayGridItemTextSelected
                                ]}>
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Modal>
            )
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pol</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={gender ? styles.pickerValue : styles.pickerPlaceholder}>
              {gender || 'Izaberite pol'}
            </Text>
          </TouchableOpacity>
          
          {showGenderPicker && (
            Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="none"
                visible={showGenderPicker}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                      <Text style={styles.datePickerButtonText}>Otkaži</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setShowGenderPicker(false)}
                    >
                      <Text style={[styles.datePickerButtonText, styles.confirmButton]}>Potvrdi</Text>
                    </TouchableOpacity>
                  </View>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue: string) => {
                      setGender(itemValue);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Izaberite pol" value="" />
                    <Picker.Item label="Muški" value="muški" />
                    <Picker.Item label="Ženski" value="ženski" />
                  </Picker>
                </View>
              </Modal>
            ) : (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showGenderPicker}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.simpleDatePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                        <Text style={styles.datePickerButtonText}>Otkaži</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.simplePickerContent}>
                      <Text style={styles.simplePickerTitle}>Izaberite pol</Text>
                      <View style={styles.genderPickerContainer}>
                        <TouchableOpacity
                          style={[
                            styles.genderOption,
                            gender === 'muški' && styles.genderOptionSelected
                          ]}
                          onPress={() => {
                            setGender('muški');
                            setShowGenderPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.genderOptionText,
                            gender === 'muški' && styles.genderOptionTextSelected
                          ]}>
                            Muški
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.genderOption,
                            gender === 'ženski' && styles.genderOptionSelected
                          ]}
                          onPress={() => {
                            setGender('ženski');
                            setShowGenderPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.genderOptionText,
                            gender === 'ženski' && styles.genderOptionTextSelected
                          ]}>
                            Ženski
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>
            )
          )}
        </View>

        <View style={styles.buttonContainer}>
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

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && { opacity: 0.6 }]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Obriši nalog</Text>
            )}
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#8BC8A3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingBottom: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  picker: {
    height: 200,
    backgroundColor: 'white',
  },
  // Simple date picker styles for Android
  simpleDatePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingBottom: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  simplePickerContent: {
    padding: 20,
  },
  simplePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Step-by-step date picker styles for Android
  stepPickerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepPickerScroll: {
    height: 200,
    width: '100%',
  },
  stepPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
    minWidth: 120,
    backgroundColor: '#f5f5f5',
  },
  stepPickerItemSelected: {
    backgroundColor: '#8BC8A3',
  },
  stepPickerItemText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  stepPickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Day grid styles
  dayGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  dayGridItem: {
    width: 40,
    height: 40,
    margin: 3,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dayGridItemSelected: {
    backgroundColor: '#8BC8A3',
    borderColor: '#8BC8A3',
  },
  dayGridItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dayGridItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Gender picker styles
  genderPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  genderOption: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#f5f5f5',
    minWidth: 120,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#8BC8A3',
    borderColor: '#8BC8A3',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileSettings; 