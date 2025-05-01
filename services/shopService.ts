import { supabase } from '../supabase';
import { ShopItem } from '../types/interfaces';

export const fetchShopItems = async (): Promise<ShopItem[]> => {
  const { data, error } = await supabase
    .from('item_shop')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addShopItem = async (item: Omit<ShopItem, 'id' | 'created_at'>): Promise<ShopItem> => {
  const { data, error } = await supabase
    .from('item_shop')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShopItem = async (id: string, updates: Partial<ShopItem>): Promise<ShopItem> => {
  const { data, error } = await supabase
    .from('item_shop')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteShopItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('item_shop')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const purchaseItem = async (userId: string, itemId: string): Promise<void> => {
  console.log('Attempting purchase with:', { userId, itemId }); // Debug log

  // First verify the purchase is possible
  const { data: item, error: itemError } = await supabase
    .from('item_shop')
    .select('*')
    .eq('id', itemId)
    .single();

  console.log('Item query result:', { item, error: itemError }); // Debug log

  if (itemError || !item) {
    console.error('Item not found:', itemError); // Debug log
    throw new Error('Artikal nije pronađen');
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('stars')
    .eq('user_id', userId)
    .single();

  console.log('Client query result:', { client, error: clientError }); // Debug log

  if (clientError || !client) {
    throw new Error('Korisnički nalog nije pronađen');
  }

  if (client.stars < item.star_price) {
    throw new Error('Nemate dovoljno Stars poena');
  }

  if (item.quantity < 1) {
    throw new Error('Artikal trenutno nije dostupan');
  }

  // Execute the purchase transaction
  const { error: purchaseError } = await supabase.rpc('purchase_shop_item', {
    p_user_id: userId,
    p_item_id: itemId
  });

  if (purchaseError) {
    console.error('Purchase error:', purchaseError); // Debug log
    throw purchaseError;
  }
};