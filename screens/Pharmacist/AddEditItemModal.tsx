import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../types/interfaces';
import { addShopItem, updateShopItem } from '../../services/shopService';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface AddEditItemModalProps {
  visible: boolean;
  item: ShopItem | null;
  onClose: () => void;
  onSave: () => void;
}

const AddEditItemModal = ({ visible, item, onClose, onSave }: AddEditItemModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [starsPrice, setStarsPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.item_name);
      setDescription(item.description);
      setStarsPrice(item.star_price.toString());
      setQuantity(item.quantity.toString());
      setImageUrl(item.image || null);
      
      // Debug log to check the image URL
      console.log('Loading item with image URL:', item.image);
    } else {
      resetForm();
    }
  }, [item]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStarsPrice('');
    setQuantity('');
    setImageUrl(null);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Potrebna dozvola', 'Potrebna je dozvola za pristup galeriji.');
        return;
      }
      
      // Use fullscreen presentation style to fix iOS 12 crash
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        try {
          const localUri = result.assets[0].uri;
          
          // First, fetch the image data
          const response = await fetch(localUri);
          const blob = await response.blob();
          
          // Create a unique filename
          const filename = `shop-item-${Date.now()}.jpg`;
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('shop-items')
            .upload(filename, blob);
            
          if (error) throw error;
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('shop-items')
            .getPublicUrl(filename);
            
          // Save the public URL, not the local URI
          setImageUrl(publicUrlData.publicUrl);
          Alert.alert('Uspeh', 'Slika je uspešno otpremljena.');
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Greška', 'Nije moguće otpremiti sliku: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Greška', 'Nije moguće otvoriti galeriju.');
    }
  };

  const handleSave = async () => {
    if (!name || !starsPrice || !quantity) {
      Alert.alert('Greška', 'Molimo popunite sva obavezna polja.');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        item_name: name,
        description: description || '',
        star_price: parseInt(starsPrice),
        quantity: parseInt(quantity),
        image: imageUrl || ''
      };

      console.log('Saving item:', itemData);

      if (item) {
        await updateShopItem(item.id, itemData);
      } else {
        await addShopItem(itemData);
      }

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Greška', 'Nije moguće sačuvati artikal. ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              {item ? 'Izmeni artikal' : 'Dodaj novi artikal'}
            </Text>

            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {imageUrl ? (
                <>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.previewImage} 
                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                  />
                  <Text style={styles.smallText}>{imageUrl}</Text>
                </>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={24} color="#666" />
                  <Text style={styles.uploadText}>Dodaj sliku</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Naziv*</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Unesite naziv artikla"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Opis</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Unesite opis artikla"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cena u Stars poenima*</Text>
              <TextInput
                style={styles.input}
                value={starsPrice}
                onChangeText={setStarsPrice}
                keyboardType="numeric"
                placeholder="Unesite cenu u Stars poenima"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Količina*</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Unesite količinu"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Otkaži</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Čuvanje...' : 'Sačuvaj'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageUpload: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 8,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  saveButton: {
    backgroundColor: '#4A9B7F',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    width: 200,
  },
});

export default AddEditItemModal; 