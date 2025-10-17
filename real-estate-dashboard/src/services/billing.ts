import { apiClient } from '../lib/api/client';

export interface BillingInfo {
  plan_key: string;
  status: string;
  limits: {
    users: number;
    properties: number;
    storage_gb: number;
    analytics: string;
    integrations?: boolean;
    reporting?: boolean;
    white_label?: boolean;
  };
  usage: {
    users: number;
    properties: number;
    storage_mb: number;
    timestamp: string;
  };
  current_period_end?: string;
}

export interface CheckoutSession {
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface TrialStatus {
  status: string;
  trial_end?: string;
  days_remaining?: number;
  is_expired?: boolean;
  show_payment_modal?: boolean;
}

export const billingService = {
  // Aktuelle Billing-Info abrufen
  async getBillingInfo(): Promise<BillingInfo> {
    const response = await apiClient.get('/api/v1/billing/me');
    return (response as any).data;
  },

  // Trial-Status abrufen
  async getTrialStatus(): Promise<TrialStatus> {
    const response = await apiClient.get('/api/v1/billing/trial-status');
    return (response as any).data;
  },

  // Stripe Checkout Session erstellen
  async createCheckoutSession(plan: string): Promise<CheckoutSession> {
    const response = await apiClient.post('/api/v1/billing/checkout', { plan });
    return (response as any).data;
  },

  // Stripe Customer Portal öffnen
  async createPortalSession(): Promise<PortalSession> {
    const response = await apiClient.post('/api/v1/billing/portal');
    return (response as any).data;
  },

  // Plan-Upgrade durchführen
  async upgradePlan(plan: string): Promise<void> {
    const checkoutSession = await this.createCheckoutSession(plan);
    // Redirect zu Stripe Checkout
    window.location.href = checkoutSession.url;
  },

  // Customer Portal öffnen
  async openCustomerPortal(): Promise<void> {
    const portalSession = await this.createPortalSession();
    // Redirect zu Stripe Customer Portal
    window.location.href = portalSession.url;
  }
};