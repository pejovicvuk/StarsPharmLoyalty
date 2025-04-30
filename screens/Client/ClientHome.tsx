import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

interface ClientHomeProps {
  user: {
    name: string;
    surname: string;
    userId: string;
  };
  onLogout: () => void;
}

const ClientHome = ({ user, onLogout }: ClientHomeProps) => {
  // Mock data
  const loyaltyPoints = 120;

  return (
    <View style={styles.container}>
      <Header 
        title="Klijent Panel" 
        rightButtonText="Nazad na odabir uloge"
        rightButtonAction={onLogout}
      />

      <ScrollView style={styles.scrollContainer}>
        {/* Loyalty Card Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vaša Kartica Lojalnosti</Text>
          <Text style={styles.cardSubtitle}>{user.name} {user.surname}</Text>
          
          <View style={styles.qrContainer}>
            <Image 
              source={require('../../assets/qr-placeholder.png')} 
              style={styles.qrCode}
              resizeMode="contain"
              // If you don't have the image, use this placeholder instead:
              // defaultSource={require('../../assets/qr-placeholder.png')}
            />
          </View>
          
          <Text style={styles.cardCaption}>
            Pokažite ovaj kod farmaceutu za skupljanje poena.
          </Text>
        </View>

        {/* Stars Balance Section */}
        <View style={styles.card}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="star" size={20} color="#E6C34A" />
            <Text style={styles.cardTitle}>Vaši Stars Poeni</Text>
          </View>
          
          <Text style={styles.pointsText}>{loyaltyPoints}</Text>
          <Text style={styles.cardSubtitle}>Skupljajte poene pri svakoj kupovini!</Text>
          
          <TouchableOpacity style={styles.buttonOutline}>
            <Text style={styles.buttonOutlineText}>Pogledaj Stars Prodavnicu</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Section */}
        <View style={styles.card}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="person-circle-outline" size={20} color="#8BC8A3" />
            <Text style={styles.cardTitle}>Uredi Profil</Text>
          </View>
          <Text style={styles.cardSubtitle}>Ažurirajte vaše lične podatke.</Text>
          
          <TouchableOpacity style={styles.buttonFilled}>
            <Text style={styles.buttonFilledText}>Podešavanja Profila</Text>
          </TouchableOpacity>
        </View>

        {/* Stars Shop Access Section */}
        <View style={styles.card}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="gift-outline" size={20} color="#8BC8A3" />
            <Text style={styles.cardTitle}>Stars Prodavnica</Text>
          </View>
          <Text style={styles.cardSubtitle}>Iskoristite svoje poene za nagrade.</Text>
          
          <TouchableOpacity style={styles.buttonFilled}>
            <Text style={styles.buttonFilledText}>Pregledaj Nagrade</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription Reminder Section */}
        <View style={styles.card}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="notifications-outline" size={20} color="#8BC8A3" />
            <Text style={styles.cardTitle}>Podsetnici za Recepte</Text>
          </View>
          <Text style={styles.cardSubtitle}>Pogledajte kada treba obnoviti recepte.</Text>
          
          <TouchableOpacity style={styles.buttonFilled}>
            <Text style={styles.buttonFilledText}>Moji Recepti</Text>
          </TouchableOpacity>
          
          <Text style={styles.noteText}>Podsetnici će se pojaviti ovde.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  qrContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    alignSelf: 'center',
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  cardCaption: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  pointsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#8BC8A3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonOutlineText: {
    color: '#8BC8A3',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonFilled: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonFilledText: {
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
});

export default ClientHome;
