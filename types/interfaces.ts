// Base user interface with common properties
export interface User {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

// Client interface extending the base User
export interface Client extends User {
  clientId: string;
  stars: number;
  qrCode: string;
  dateOfBirth: Date;
  gender: string;
  phone: string;
}

// Pharmacist interface extending the base User
export interface Pharmacist extends User {
  pharmacistId: string;
}

// Database model interfaces (matching your Supabase tables)
export interface UserModel {
  id: number;
  email: string;
  password: string;
  role: 'client' | 'pharmacist';
  first_name: string;
  last_name: string;
}

export interface ClientModel {
  id: number;
  user_id: number;
  stars: number;
  qr_code: string;
  date_of_birth: string;
  gender: string;
  phone: string;
}

export interface PharmacistModel {
  id: number;
  user_id: number;
}
export interface ShopItem {
  id: string;  // This should be a UUID string
  item_name: string;
  description: string;
  image?: string;
  star_price: number;
  quantity: number;
  created_at: string;
}