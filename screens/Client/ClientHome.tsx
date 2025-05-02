import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase } from '../../supabase';
import { User, ClientModel } from '../../types/interfaces';
import { fetchClientDetails } from '../../services/authService';
import ProfileSettings from './ProfileSettings';
import StarsShop from './StarsShop';
import { purchaseItem } from '../../services/shopService';
import UserQRCode from '../../components/UserQRCode';

interface ClientHomeProps {
  user: User;
  onLogout: () => void;
  onNavigateToSettings?: () => void;
}

const ClientHome = ({ user, onLogout, onNavigateToSettings }: ClientHomeProps) => {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [clientDetails, setClientDetails] = useState<ClientModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  
  useEffect(() => {
    // Fetch client data from Supabase
    const fetchClientData = async () => {
      try {
        setIsLoading(true);
        const clientData = await fetchClientDetails(user.userId);
        
        if (clientData) {
          setClientDetails(clientData);
          setLoyaltyPoints(clientData.stars);
        } else {
          console.error('No client data found for user ID:', user.userId);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientData();
  }, [user.userId]);

  const handleProfileUpdate = async () => {
    // Refresh client data after update
    const updatedData = await fetchClientDetails(user.userId);
    if (updatedData) {
      setClientDetails(updatedData);
    }
  };

  const handlePurchase = async (itemId: string): Promise<void> => {
    try {
      await purchaseItem(user.userId, itemId);
      const updatedData = await fetchClientDetails(user.userId);
      if (updatedData) {
        setClientDetails(updatedData);
        setLoyaltyPoints(updatedData.stars);
      }
    } catch (error: any) {
      throw error; // Let StarsShop handle the error display
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Klijent Panel" 
        rightButtonText="Odjavi se"
        rightButtonAction={onLogout}
      />

      {showSettings && clientDetails ? (
        <ProfileSettings
          clientDetails={clientDetails}
          onBack={() => setShowSettings(false)}
          onUpdate={handleProfileUpdate}
        />
      ) : showShop ? (
        <StarsShop
          userStars={loyaltyPoints}
          onBack={() => setShowShop(false)}
          onPurchase={handlePurchase}
        />
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Loyalty Card Section with QR Code */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vaša Kartica Lojalnosti</Text>
            <Text style={[styles.cardSubtitle, styles.clientName]}>
              {user.name} {user.surname}
            </Text>
            
            <View style={styles.qrContainer}>
              <UserQRCode userId={user.userId} size={180} />
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
            
            <TouchableOpacity 
              style={styles.buttonOutline}
              onPress={() => setShowShop(true)}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="cart-outline" size={20} color="#8BC8A3" style={styles.buttonIcon} />
                <Text style={styles.buttonOutlineText}>Pregledaj Stars Prodavnicu</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Client Details Section */}
          {clientDetails && (
            <View style={styles.card}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="information-circle-outline" size={20} color="#8BC8A3" />
                <Text style={styles.cardTitle}>Vaši Podaci</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Godine:</Text>
                <Text style={styles.detailValue}>{clientDetails.date_of_birth}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pol:</Text>
                <Text style={styles.detailValue}>{clientDetails.gender}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Telefon:</Text>
                <Text style={styles.detailValue}>{clientDetails.phone}</Text>
              </View>
            </View>
          )}

          {/* Edit Profile Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="person-circle-outline" size={20} color="#8BC8A3" />
              <Text style={styles.cardTitle}>Uredi Profil</Text>
            </View>
            <Text style={styles.cardSubtitle}>Ažurirajte vaše lične podatke.</Text>
            
            <TouchableOpacity 
              style={styles.buttonFilled}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.buttonFilledText}>Podešavanja Profila</Text>
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
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A9B7F',
    marginLeft: 5,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'center',
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  qrText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ClientHome;
