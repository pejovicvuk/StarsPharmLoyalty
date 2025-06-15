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
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../types/interfaces';
import { fetchShopItems } from '../../services/shopService';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 items per row with padding

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

interface ItemDetailModalProps {
  visible: boolean;
  item: ShopItem | null;
  userStars: number;
  onClose: () => void;
  onPurchase: (item: ShopItem) => void;
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

const ItemDetailModal = ({ visible, item, userStars, onClose, onPurchase }: ItemDetailModalProps) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
  >
    <View style={styles.detailModalContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeDetailButton}>
          <Ionicons name="close" size={24} color="#4A9B7F" />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Detalji artikla</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.detailContent}>
        {item?.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.detailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.detailPlaceholderImage}>
            <Ionicons name="gift-outline" size={80} color="#ccc" />
          </View>
        )}
        
        <View style={styles.detailInfo}>
          <Text style={styles.detailItemName}>{item?.item_name}</Text>
          <Text style={styles.detailItemDescription}>{item?.description}</Text>
          
          <View style={styles.detailFooter}>
            <View style={styles.detailPriceContainer}>
              <Ionicons name="star" size={24} color="#4A9B7F" />
              <Text style={styles.detailItemPrice}>{item?.star_price}</Text>
            </View>
            <Text style={styles.detailItemQuantity}>
              Dostupno: {item?.quantity}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.detailPurchaseButton,
              (userStars < (item?.star_price || 0) || (item?.quantity || 0) <= 0) && styles.disabledButton
            ]}
            onPress={() => item && onPurchase(item)}
            disabled={userStars < (item?.star_price || 0) || (item?.quantity || 0) <= 0}
          >
            <Text style={styles.detailPurchaseButtonText}>
              {userStars < (item?.star_price || 0) ? 'Nedovoljno poena' : 
               (item?.quantity || 0) <= 0 ? 'Nema na stanju' : 'Kupi artikal'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

const StarsShop = ({ userStars, onBack, onPurchase }: StarsShopProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseConfirmation, setPurchaseConfirmation] = useState<{
    visible: boolean;
    item: ShopItem | null;
  }>({ visible: false, item: null });
  const [itemDetail, setItemDetail] = useState<{
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

  useEffect(() => {
    filterItems();
  }, [items, searchQuery]);

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

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
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
              setItemDetail({ visible: false, item: null });
              setPurchaseConfirmation({ visible: true, item });
            } catch (error: any) {
              Alert.alert('Greška', error.message || 'Nije moguće izvršiti kupovinu.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity 
      style={styles.compactItemCard}
      onPress={() => setItemDetail({ visible: true, item })}
      activeOpacity={0.7}
    >
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.compactItemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.compactPlaceholderImage}>
          <Ionicons name="gift-outline" size={30} color="#ccc" />
        </View>
      )}
      
      <View style={styles.compactItemInfo}>
        <Text style={styles.compactItemName} numberOfLines={2} ellipsizeMode="tail">
          {item.item_name}
        </Text>
        <Text style={styles.compactItemDescription} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
        
        <View style={styles.compactItemFooter}>
          <View style={styles.compactPriceContainer}>
            <Ionicons name="star" size={14} color="#4A9B7F" />
            <Text style={styles.compactItemPrice}>{item.star_price}</Text>
          </View>
          <Text style={styles.compactItemQuantity}>
            {item.quantity > 0 ? `Dostupno: ${item.quantity}` : 'Nema na stanju'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/starsPharmLogo.png')}
        style={styles.backgroundLogo}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretražite artikle..."
            placeholderTextColor="#7F8C8D"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4A9B7F" style={styles.loader} />
      ) : (
        <>
          {filteredItems.length === 0 && searchQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={60} color="#ccc" />
              <Text style={styles.noResultsText}>Nema rezultata za "{searchQuery}"</Text>
              <Text style={styles.noResultsSubtext}>Pokušajte sa drugim pojmom</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
      
      <PurchaseConfirmationModal
        visible={purchaseConfirmation.visible}
        item={purchaseConfirmation.item}
        onClose={() => setPurchaseConfirmation({ visible: false, item: null })}
      />
      
      <ItemDetailModal
        visible={itemDetail.visible}
        item={itemDetail.item}
        userStars={userStars}
        onClose={() => setItemDetail({ visible: false, item: null })}
        onPurchase={handlePurchase}
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
  // Search bar styles
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  clearButton: {
    padding: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  // Compact item card styles
  compactItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    width: itemWidth,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  compactItemImage: {
    width: itemWidth,
    height: itemWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  compactPlaceholderImage: {
    width: itemWidth,
    height: itemWidth,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  compactItemInfo: {
    padding: 12,
  },
  compactItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
    height: 36,
  },
  compactItemDescription: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
    height: 32,
    lineHeight: 16,
    overflow: 'hidden',
  },
  compactItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A9B7F',
    marginLeft: 3,
  },
  compactItemQuantity: {
    fontSize: 12,
    color: '#95A5A6',
    fontWeight: '500',
  },
  // Detail modal styles
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  closeDetailButton: {
    padding: 8,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  detailContent: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 300,
  },
  detailPlaceholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailItemName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  detailItemDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F5',
    padding: 12,
    borderRadius: 10,
  },
  detailItemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A9B7F',
    marginLeft: 8,
  },
  detailItemQuantity: {
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '500',
  },
  detailPurchaseButton: {
    backgroundColor: '#4A9B7F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailPurchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Original styles for modals
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default StarsShop; 