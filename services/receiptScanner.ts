/**
 * Receipt Scanner Service
 * Handles the processing of scanned receipt QR codes
 * 
 * React Native/Expo compatible version
 * Dependencies needed: npm install axios
 */

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../supabase';

interface ReceiptItem {
  gtin: string;
  name: string;
  quantity: number;
  total: number;
  unitPrice: number;
  label: string;
  labelRate: number;
  taxBaseAmount: number;
  vatAmount: number;
}

interface ReceiptSpecifications {
  success: boolean;
  items?: ReceiptItem[];
}

interface ExtractedData {
  invoiceNumber: string;
  token: string;
}

/**
 * Simple cookie manager for React Native/Expo
 */
class CookieManager {
  private cookies: Map<string, string> = new Map();

  /**
   * Parse and store cookies from Set-Cookie header
   */
  parseCookies(setCookieHeader: string | string[] | undefined) {
    if (!setCookieHeader) return;
    
    const cookieHeaders = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    
    cookieHeaders.forEach(cookieStr => {
      // Extract cookie name and value (ignore attributes like path, domain, etc.)
      const cookieParts = cookieStr.split(';')[0].trim();
      const [name, value] = cookieParts.split('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    });
    
    // Ensure we always have the localization cookie
    if (!this.cookies.has('localization')) {
      this.cookies.set('localization', 'sr-Cyrl-RS');
    }
  }

  /**
   * Get cookies as a string for Cookie header
   */
  getCookieString(): string {
    const cookieArray: string[] = [];
    this.cookies.forEach((value, name) => {
      cookieArray.push(`${name}=${value}`);
    });
    return cookieArray.length > 0 ? cookieArray.join('; ') : 'localization=sr-Cyrl-RS';
  }

  /**
   * Log current cookies for debugging
   */
  logCookies() {
    console.log(`📝 Current cookies: ${this.getCookieString()}`);
  }
}

/**
 * Create axios instance with timeout and proper config for React Native
 */
const createAxiosInstance = (): AxiosInstance => {
  return axios.create({
    timeout: 15000,
    validateStatus: (status) => status < 400, // Don't throw on 4xx errors
  });
};

/**
 * Extract invoice number and token from JavaScript viewModel
 */
const extractInvoiceDataFromJS = async (
  refererUrl: string, 
  axiosInstance: AxiosInstance, 
  cookieManager: CookieManager
): Promise<ExtractedData | null> => {
  console.log("🔍 Extracting data from JavaScript viewModel...");
  
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8',
    'Sec-Ch-Ua': '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Gpc': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
  };
  
  try {
    const response = await axiosInstance.get(refererUrl, { headers });
    
    if (response.status === 200) {
      // Parse and store cookies from response
      const setCookieHeader = response.headers['set-cookie'];
      cookieManager.parseCookies(setCookieHeader);
      cookieManager.logCookies();
      
      const htmlContent = response.data;
      
      // Extract invoice number using regex
      const invoicePattern = /viewModel\.InvoiceNumber\(['"]([^'"]+)['"]\)/;
      const invoiceMatch = htmlContent.match(invoicePattern);
      
      // Extract token using regex
      const tokenPattern = /viewModel\.Token\(['"]([^'"]+)['"]\)/;
      const tokenMatch = htmlContent.match(tokenPattern);
      
      const invoiceNumber = invoiceMatch?.[1];
      const token = tokenMatch?.[1];
      
      if (invoiceNumber && token) {
        console.log("✅ Successfully extracted:");
        console.log(`  Invoice Number: ${invoiceNumber}`);
        console.log(`  Token: ${token}`);
        return { invoiceNumber, token };
      } else {
        console.log("❌ Could not find viewModel data in JavaScript");
        if (!invoiceMatch) console.log("  - Invoice number not found");
        if (!tokenMatch) console.log("  - Token not found");
        return null;
      }
    } else {
      console.log(`❌ Failed to load page: ${response.status}`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Axios error: ${error.message}`);
      console.log(`Response status: ${error.response?.status}`);
      console.log(`Response data: ${error.response?.data}`);
    } else {
      console.log(`❌ Error extracting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
};

/**
 * Fetch specifications using extracted invoice number and token
 */
const fetchSpecifications = async (
  refererUrl: string, 
  invoiceNumber: string, 
  token: string,
  axiosInstance: AxiosInstance,
  cookieManager: CookieManager
): Promise<ReceiptSpecifications | null> => {
  const specsUrl = "https://suf.purs.gov.rs/specifications";
  
  const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,eng=0.9',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': cookieManager.getCookieString(),
    'Origin': 'https://suf.purs.gov.rs',
    'Priority': 'u=1, i',
    'Referer': refererUrl,
    'Sec-Ch-Ua': '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Gpc': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  // Create form data - React Native compatible
  const formData = `invoiceNumber=${encodeURIComponent(invoiceNumber)}&token=${encodeURIComponent(token)}`;
  
  try {
    console.log("\n🚀 Making API request...");
    console.log(`URL: ${specsUrl}`);
    console.log(`Form data: invoiceNumber=${invoiceNumber}, token=${token}`);
    cookieManager.logCookies();
    console.log("-".repeat(50));
    
    const response = await axiosInstance.post(specsUrl, formData, { headers });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const responseData = response.data;
      const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      
      console.log("✅ SUCCESS! Here's the JSON response:");
      console.log(responseText);
      
      try {
        const parsedJson: ReceiptSpecifications = typeof responseData === 'string' 
          ? JSON.parse(responseData) 
          : responseData;
          
        if (parsedJson.success) {
          console.log(`\n📊 Found ${parsedJson.items?.length || 0} items in the receipt`);
        }
        return parsedJson;
      } catch (e) {
        console.log("❌ Failed to parse JSON response");
        console.log(`Raw response: ${responseText}`);
        return null;
      }
    } else {
      console.log(`❌ API request failed: ${response.data}`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Axios error: ${error.message}`);
      console.log(`Response status: ${error.response?.status}`);
      console.log(`Response data: ${error.response?.data}`);
    } else {
      console.log(`❌ Error making API request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
};

/**
 * Process a scanned receipt URL
 * @param receiptUrl The URL from the scanned receipt QR code
 * @param userId The ID of the user who will receive stars
 */
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
    
    console.log("📋 Receipt Specifications Fetcher");
    console.log("=".repeat(40));
    
    // Create axios instance and cookie manager
    const axiosInstance = createAxiosInstance();
    const cookieManager = new CookieManager();
    
    // Step 1: Extract invoice data from JavaScript and capture cookies
    const extractedData = await extractInvoiceDataFromJS(receiptUrl, axiosInstance, cookieManager);
    
    if (!extractedData) {
      console.log("\n❌ Could not extract required data automatically.");
      console.log("💡 Please check if the URL is correct and the page loads properly.");
      return {
        success: false,
        message: 'Could not extract invoice data from receipt URL',
      };
    }
    
    const { invoiceNumber, token } = extractedData;
    
    // Step 2: Fetch specifications using the same session with cookies
    const result = await fetchSpecifications(receiptUrl, invoiceNumber, token, axiosInstance, cookieManager);
    
    if (result && result.success) {
      console.log("\n🎉 Receipt data fetched successfully!");
      
      // Log the complete JSON for debugging
      console.log("\n📄 Complete Receipt JSON:");
      console.log(JSON.stringify(result, null, 2));
      
      // Calculate total amount from items
      const totalAmount = result.items?.reduce((sum, item) => sum + item.total, 0) || 0;
      console.log(`\n💰 Total receipt amount: ${totalAmount} RSD`);
      
      // Step 3: Calculate stars to award based on totalAmount (2 RSD = 1 star)
      const starsToAward = Math.floor(totalAmount / 100);
      console.log(`\n⭐ Stars to award: ${starsToAward}`);
      
      try {
        // First, get the client ID from the user_id
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
        
        // 1. Insert the receipt into the receipts table
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            client_id: clientId,
            receipt_url: receiptUrl.substring(0, 2000), // Ensure it fits in text field by limiting length
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
        
        // 2. Process and store each item from the receipt
        if (result.items && result.items.length > 0) {
          for (const item of result.items) {
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
            
            // 3. Insert the receipt_item relationship
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
          
          console.log(`\n✅ Stored ${result.items.length} items from the receipt`);
        }
        
        // 4. Update the client's stars
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
        
        console.log(`\n✅ Successfully updated stars for client ${clientId}`);
        console.log(`Previous stars: ${currentStars}`);
        console.log(`Added stars: ${starsToAward}`);
        console.log(`New total: ${newStarsTotal}`);
        
        return {
          success: true,
          message: `Uspešno dodato ${starsToAward} zvezdica!`,
          data: {
            invoiceNumber,
            totalAmount,
            itemCount: result.items?.length || 0,
            starsAwarded: starsToAward,
            newStarsTotal,
            receiptId
          }
        };
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return {
          success: false,
          message: `Error updating database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        };
      }
    } else {
      console.log("\n❌ Failed to fetch receipt data.");
      console.log("💡 The session might have expired. Try with a fresh URL.");
      return {
        success: false,
        message: 'Failed to fetch receipt specifications',
      };
    }
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