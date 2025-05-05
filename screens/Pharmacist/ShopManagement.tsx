import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ShopItem } from '../../types/interfaces';
import { fetchShopItems, deleteShopItem } from '../../services/shopService';
import AddEditItemModal from './AddEditItemModal';

interface ShopManagementProps {
  onBack: () => void;
}

const ShopManagement = ({ onBack }: ShopManagementProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

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

  const handleDelete = async (itemId: string) => {
    Alert.alert(
      'Potvrda',
      'Da li ste sigurni da želite da obrišete ovaj artikal?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShopItem(itemId);
              await loadItems();
            } catch (error) {
              Alert.alert('Greška', 'Nije moguće obrisati artikal.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <View style={styles.itemCard}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemStars}>{item.star_price} Stars</Text>
        <Text style={styles.itemQuantity}>Količina: {item.quantity}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          onPress={() => {
            setEditingItem(item);
            setModalVisible(true);
          }}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={20} color="#4A9B7F" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item.id.toString())}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/starsPharmLogo.png')}
        style={styles.backgroundLogo}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A9B7F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apoteka StarsPharm</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A9B7F" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddEditItemModal
        visible={modalVisible}
        item={editingItem}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onSave={loadItems}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4A9B7F',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#4A9B7F',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderColor: '#E8E8E8',
    borderWidth: 1,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemStars: {
    fontSize: 16,
    color: '#4A9B7F',
    fontWeight: '700',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
  itemActions: {
    justifyContent: 'space-around',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#E8E8E8',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  backgroundLogo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.05,
    resizeMode: 'contain',
    alignSelf: 'center',
  }
});

export default ShopManagement; 