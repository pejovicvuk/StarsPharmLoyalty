import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../types/interfaces';
import { fetchShopItems } from '../../services/shopService';
import { supabase } from '../../supabase';

interface StarsShopProps {
  userStars: number;
  onBack: () => void;
  onPurchase: (itemId: string) => Promise<void>;
}

interface PurchaseConfirmationModalProps {
  visible: boolean;
  item: ShopItem | null;
  onClose: () => void;
}

const PurchaseConfirmationModal = ({ visible, item, onClose }: PurchaseConfirmationModalProps) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Ionicons name="checkmark-circle" size={60} color="#4A9B7F" />
        <Text style={styles.confirmationTitle}>Uspešna kupovina!</Text>
        <Text style={styles.confirmationText}>
          Kupili ste {item?.item_name} za {item?.star_price} Stars poena
        </Text>
        <Text style={styles.instructionText}>
          Pokažite ovu potvrdu farmaceutu prilikom preuzimanja artikla
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Zatvori</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const StarsShop = ({ userStars, onBack, onPurchase }: StarsShopProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [purchaseConfirmation, setPurchaseConfirmation] = useState<{
    visible: boolean;
    item: ShopItem | null;
  }>({ visible: false, item: null });

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    
    getSession();
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const shopItems = await fetchShopItems();
      setItems(shopItems);
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće učitati artikle.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (userStars < item.star_price) {
      Alert.alert('Nedovoljno poena', 'Nemate dovoljno Stars poena za ovaj artikal.');
      return;
    }

    Alert.alert(
      'Potvrda kupovine',
      `Da li želite da kupite ${item.item_name} za ${item.star_price} Stars poena?`,
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Kupi',
          onPress: async () => {
            try {
              await onPurchase(item.id);
              await loadItems();
              setPurchaseConfirmation({ visible: true, item });
            } catch (error: any) {
              Alert.alert('Greška', error.message || 'Nije moguće izvršiti kupovinu.');
            }
          },
        },
      ]
    );
  };

  const fetchImage = async (imageUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/starsPharmLogo.png')}
        style={styles.backgroundLogo}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#4A9B7F" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              {item.image ? (
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="gift-outline" size={50} color="#ccc" />
                </View>
              )}
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <View style={styles.itemFooter}>
                <View style={styles.priceContainer}>
                  <Ionicons name="star" size={18} color="#E6C34A" />
                  <Text style={styles.itemPrice}>{item.star_price}</Text>
                </View>
                <Text style={styles.itemQuantity}>
                  Dostupno: {item.quantity}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  (userStars < item.star_price || item.quantity <= 0) && styles.disabledButton
                ]}
                onPress={() => handlePurchase(item)}
                disabled={userStars < item.star_price || item.quantity <= 0}
              >
                <Text style={styles.purchaseButtonText}>Kupi</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <PurchaseConfirmationModal
        visible={purchaseConfirmation.visible}
        item={purchaseConfirmation.item}
        onClose={() => setPurchaseConfirmation({ visible: false, item: null })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backgroundLogo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.05,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    padding: 16,
    paddingBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6C34A',
    marginLeft: 6,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
  purchaseButton: {
    backgroundColor: '#4A9B7F',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#4A9B7F',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#4A9B7F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StarsShop; 