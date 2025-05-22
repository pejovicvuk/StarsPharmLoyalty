import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import ShopManagement from './ShopManagement';
import { Camera, CameraView } from 'expo-camera';
import { supabase } from '../../supabase';
import receiptScanner from '../../services/receiptScanner';

interface PharmacistHomeProps {
  user: {
    name: string;
    surname: string;
    userId: string;
    role: string;
  };
  onLogout: () => void;
}

const PharmacistHome = ({ user, onLogout }: PharmacistHomeProps) => {
  const statusBarHeight = StatusBar.currentHeight || 0;
  const [showShopManagement, setShowShopManagement] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    lastScannedRef.current = null;
  };

  const handleBarCodeScanned = useCallback(({ type, data }: { type: string; data: string }) => {
    // Prevent multiple scans of the same code within 2 seconds
    if (lastScannedRef.current === data) {
      return;
    }

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    lastScannedRef.current = data;

    try {
      const scannedData = JSON.parse(data);
      console.log('Scanned data:', scannedData);
      
      setScannedUserId(scannedData.u);
      setShowScanner(false);
      setShowReceiptScanner(true);
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      Alert.alert('Nevažeći QR kod');
      // Reset last scanned after 2 seconds to allow new scan attempts
      scanTimeoutRef.current = setTimeout(() => {
        lastScannedRef.current = null;
      }, 2000);
    }
  }, []);

  const handleReceiptScanned = useCallback(({ type, data }: { type: string; data: string }) => {
    // Prevent multiple scans of the same code within 2 seconds
    if (lastScannedRef.current === data) {
      return;
    }

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    lastScannedRef.current = data;

    try {
      console.log('Scanned receipt URL:', data);
      
      // Call the receipt scanner service with the scanned URL and user ID
      if (scannedUserId) {
        receiptScanner.processReceiptScan(data, scannedUserId)
          .then(result => {
            if (result.success) {
              Alert.alert('Uspeh', 'Račun je uspešno skeniran.');
            } else {
              Alert.alert('Greška', result.message || 'Došlo je do greške prilikom skeniranja računa.');
            }
          })
          .catch(error => {
            console.error('Error processing receipt:', error);
            Alert.alert('Greška', 'Došlo je do greške prilikom obrade računa.');
          });
      } else {
        Alert.alert('Greška', 'Korisnik nije identifikovan.');
      }
      
      setShowReceiptScanner(false);
      setScannedUserId(null);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      Alert.alert('Greška', 'Došlo je do greške prilikom skeniranja računa.');
      // Reset last scanned after 2 seconds to allow new scan attempts
      scanTimeoutRef.current = setTimeout(() => {
        lastScannedRef.current = null;
      }, 2000);
    }
  }, [scannedUserId]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      
      {/* Custom header that matches the design */}
      <Header 
        title="Farmaceut" 
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
            <Text style={styles.cardSubtitle}>
              Skenirajte QR kod klijenta i fiskalni račun.
            </Text>
            
            <TouchableOpacity 
              style={styles.buttonGreen}
              onPress={() => {
                requestCameraPermission();
                setShowScanner(true);
              }}
            >
              <Text style={styles.buttonGreenText}>Otvori Skener</Text>
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

          {/* Logout Section */}
          <View style={styles.card}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
              <Text style={styles.cardTitle}>Odjava</Text>
            </View>
            <Text style={styles.cardSubtitle}>Odjavite se sa vašeg naloga.</Text>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={onLogout}
            >
              <Text style={styles.logoutButtonText}>Odjavi se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowScanner(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          {hasPermission === null ? (
            <Text>Requesting camera permission</Text>
          ) : hasPermission === false ? (
            <Text>No access to camera</Text>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />
          )}
        </View>
      </Modal>

      {/* Receipt Scanner Modal */}
      <Modal
        visible={showReceiptScanner}
        animationType="slide"
        onRequestClose={() => {
          setShowReceiptScanner(false);
          setScannedUserId(null);
        }}
      >
        <View style={styles.scannerContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setShowReceiptScanner(false);
              setScannedUserId(null);
            }}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.scannerInstructions}>
            <Text style={styles.scannerTitle}>Skenirajte fiskalni račun</Text>
            <Text style={styles.scannerSubtitle}>Postavite QR kod sa računa u okvir</Text>
          </View>
          
          {hasPermission === null ? (
            <Text>Requesting camera permission</Text>
          ) : hasPermission === false ? (
            <Text>No access to camera</Text>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleReceiptScanned}
            />
          )}
        </View>
      </Modal>
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
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontWeight: '500',
    fontSize: 14,
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
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  scannerInstructions: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  scannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scannerSubtitle: {
    color: 'white',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default PharmacistHome; 