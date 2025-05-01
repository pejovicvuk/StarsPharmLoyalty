import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import ShopManagement from './ShopManagement';

interface PharmacistHomeProps {
  user: {
    name: string;
    surname: string;
    userId: string;
  };
  onLogout: () => void;
}

const PharmacistHome = ({ user, onLogout }: PharmacistHomeProps) => {
  const statusBarHeight = StatusBar.currentHeight || 0;
  const [showShopManagement, setShowShopManagement] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      
      {/* Custom header that matches the design */}
      <Header 
        title="Farmaceut" 
        rightButtonText="Nazad na odabir uloge"
        rightButtonAction={onLogout}
      />

      {showShopManagement ? (
        <ShopManagement onBack={() => setShowShopManagement(false)} />
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* QR Scanner Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="qr-code-outline" size={20} color="#4A9B7F" />
              <Text style={styles.cardTitle}>Skeniraj Kodove</Text>
            </View>
            <Text style={styles.cardSubtitle}>Skenirajte QR kod klijenta i fiskalni račun.</Text>
            
            <TouchableOpacity style={styles.buttonGreen}>
              <Text style={styles.buttonGreenText}>Otvori Skener (WIP)</Text>
            </TouchableOpacity>
            
            <Text style={styles.noteText}>
              Funkcionalnost skenera će biti dodata kasnije.
            </Text>
          </View>

          {/* Confirm Purchase Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4A9B7F" />
              <Text style={styles.cardTitle}>Potvrdi Stars Kupovinu</Text>
            </View>
            <Text style={styles.cardSubtitle}>Unesite kod za potvrdu kupovine nagrade.</Text>
            
            <TouchableOpacity style={styles.buttonLight}>
              <Text style={styles.buttonLightText}>Potvrdi Kupovinu</Text>
            </TouchableOpacity>
          </View>

          {/* Manage Stars Shop Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="cart-outline" size={20} color="#4A9B7F" />
              <Text style={styles.cardTitle}>Upravljaj Stars Prodavnicom</Text>
            </View>
            <Text style={styles.cardSubtitle}>Dodaj, izmeni ili ukloni nagrade.</Text>
            
            <TouchableOpacity 
              style={styles.buttonFilled}
              onPress={() => setShowShopManagement(true)}
            >
              <Text style={styles.buttonFilledText}>Upravljaj Prodavnicom</Text>
            </TouchableOpacity>
          </View>

          {/* Manage Prescriptions Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="list-outline" size={20} color="#4A9B7F" />
              <Text style={styles.cardTitle}>Upravljaj Receptima</Text>
            </View>
            <Text style={styles.cardSubtitle}>Dodaj recepte i pregledaj podsetnike.</Text>
            
            <TouchableOpacity style={styles.buttonLight}>
              <Text style={styles.buttonLightText}>Upravljaj Receptima</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#8BC8A3',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#333',
  },
  scrollContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A9B7F',
    marginLeft: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  buttonGreen: {
    backgroundColor: '#4A9B7F',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonGreenText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonLight: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonLightText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonFilled: {
    backgroundColor: '#4A9B7F',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonFilledText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default PharmacistHome; 