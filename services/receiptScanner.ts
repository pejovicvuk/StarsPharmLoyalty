/**
 * Receipt Scanner Service
 * Handles the processing of scanned receipt QR codes
 * 
 * React Native/Expo compatible version
 * Dependencies needed: npm install axios
 */

import { supabase } from '../supabase';
import { scanReceipt } from 'receiptrs';

export const processReceiptScan = async (receiptUrl: string, userId: string) => {
  console.log('Processing receipt:', receiptUrl);
  console.log('For user:', userId);

  try {
    // Validate receipt URL
    if (!receiptUrl || !receiptUrl.includes('suf.purs.gov.rs')) {
      console.log('❌ Invalid receipt URL');
      return {
        success: false,
        message: 'Invalid receipt URL',
      };
    }

    // Use receiptrs to scan the receipt
    const result = await scanReceipt(receiptUrl) as any;
    console.log('receiptrs result:', JSON.stringify(result, null, 2));

    if (!result.success || !result.data?.success) {
      return {
        success: false,
        message: result.message || result.data?.message || 'Failed to scan receipt',
      };
    }

    // Use totalAmount from receiptrs result
    const totalAmount = result.data.totalAmount || 0;
    // Calculate stars to award based on totalAmount (2 RSD = 1 star)
    const starsToAward = Math.floor(totalAmount / 100);

    // Get the client ID from the user_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, stars')
      .eq('user_id', userId)
      .single();

    if (clientError) {
      console.log('❌ Error fetching client data:', clientError.message);
      return {
        success: false,
        message: 'Error fetching client data',
      };
    }

    const clientId = clientData.id;
    const currentStars = clientData.stars || 0;
    const newStarsTotal = currentStars + starsToAward;

    // Insert the receipt into the receipts table
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        client_id: clientId,
        receipt_url: receiptUrl.substring(0, 2000),
        amount: totalAmount,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (receiptError) {
      console.log('❌ Error storing receipt:', receiptError.message);
      return {
        success: false,
        message: 'Error storing receipt data',
      };
    }

    const receiptId = receiptData.id;
    console.log(`\n📝 Receipt stored with ID: ${receiptId}`);

    // Process and store each item from the receipt
    if (result.data.items && result.data.items.length > 0) {
      for (const item of result.data.items) {
        // Check if the item already exists in the items table
        const { data: existingItem, error: itemFetchError } = await supabase
          .from('items')
          .select('id')
          .eq('name', item.name)
          .maybeSingle();

        let itemId;

        if (existingItem) {
          // Item already exists
          itemId = existingItem.id;
        } else {
          // Insert new item
          const { data: newItem, error: itemInsertError } = await supabase
            .from('items')
            .insert({
              name: item.name,
              description: `GTIN: ${item.gtin}`,
              price: item.unitPrice
            })
            .select()
            .single();

          if (itemInsertError) {
            console.log(`❌ Error storing item ${item.name}:`, itemInsertError.message);
            continue; // Skip this item but continue with others
          }

          itemId = newItem.id;
        }

        // Insert the receipt_item relationship
        for (let i = 0; i < item.quantity; i++) {
          const { error: receiptItemError } = await supabase
            .from('receipt_items')
            .insert({
              receipt_id: receiptId,
              item_id: itemId
            });
        
          if (receiptItemError) {
            console.log(`❌ Error linking item ${item.name} to receipt:`, receiptItemError.message);
          }
        }
      }

      console.log(`\n✅ Stored ${result.data.items.length} items from the receipt`);
    }

    // Update the client's stars
    const { error: updateError } = await supabase
      .from('clients')
      .update({ stars: newStarsTotal })
      .eq('id', clientId);

    if (updateError) {
      console.log('❌ Error updating client stars:', updateError.message);
      return {
        success: false,
        message: 'Error updating client stars',
      };
    }

    console.log(`\n✅ Successfully updated points for client ${clientId}`);
    console.log(`Previous stars: ${currentStars}`);
    console.log(`Added stars: ${starsToAward}`);
    console.log(`New total: ${newStarsTotal}`);

    return {
      success: true,
      message: `Uspešno dodato ${starsToAward} zvezdica!`,
      data: {
        invoiceNumber: result.data.invoiceNumber,
        totalAmount,
        itemCount: result.data.items?.length || 0,
        starsAwarded: starsToAward,
        newStarsTotal,
        receiptId
      }
    };
  } catch (error) {
    console.error('❌ Error processing receipt:', error);
    return {
      success: false,
      message: `Error processing receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

export default {
  processReceiptScan,
};