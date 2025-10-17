import axios from 'axios';

// Unauthentifizierter API Client für Registration
const registrationApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Plan {
  users: number;
  properties: number;
  storage_gb: number;
  analytics: string;
  integrations?: boolean;
  reporting?: boolean;
  white_label?: boolean;
  price_id?: string;
  available?: boolean;
}

export interface Plans {
  [key: string]: Plan;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export interface RegistrationData {
  plan: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export const registrationService = {
  // Hole verfügbare Pläne
  async getPlans(): Promise<Plans> {
    try {
      console.log('🔍 RegistrationService: Fetching plans...');
      const response = await registrationApiClient.get('/api/v1/registration/plans');
      console.log('🔍 RegistrationService: Plans response:', response);
      return response.data.plans;
    } catch (error) {
      console.error('❌ RegistrationService: Error fetching plans:', error);
      throw error;
    }
  },
  
  // Erstelle Stripe Checkout
  async createCheckout(data: RegistrationData): Promise<CheckoutSession> {
    try {
      console.log('🔍 RegistrationService: Creating checkout...', data);
      const response = await registrationApiClient.post('/api/v1/registration/create-checkout', data);
      console.log('🔍 RegistrationService: Checkout response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ RegistrationService: Error creating checkout:', error);
      throw error;
    }
  },
  
  // Vervollständige Registrierung nach Payment
  async completeRegistration(data: {
    session_id: string;
    company_name: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      console.log('🔍 RegistrationService: Completing registration...', data);
      const response = await registrationApiClient.post('/api/v1/registration/complete', data);
      console.log('🔍 RegistrationService: Complete response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ RegistrationService: Error completing registration:', error);
      throw error;
    }
  }
};
