import { UserPlan, PLAN_PRICES } from './plans';

// Wompi API Configuration
// Para usar producción, asegúrate de tener WOMPI_ENV=production en tu .env
const isProduction =
  process.env.WOMPI_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

export const WOMPI_CONFIG = {
  baseUrl: isProduction
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1',
  publicKey: process.env.WOMPI_PUBLIC_KEY!,
  privateKey: process.env.WOMPI_PRIVATE_KEY!,
  webhookSecret: process.env.WOMPI_EVENTS_SECRET!,
  acceptanceToken: process.env.WOMPI_ACCEPTANCE_TOKEN!,
  environment: isProduction ? 'production' : 'sandbox',
};

// Wompi API Types
export interface WompiSubscription {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAUSED';
  customer_email: string;
  amount_in_cents: number;
  currency: string;
  reference: string;
  created_at: string;
  next_payment_date: string;
  payment_method: {
    type: string;
    token: string;
  };
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      payment_method_type: string;
      created_at: string;
    };
    subscription?: {
      id: string;
      status: string;
    };
  };
}

export interface CreateSubscriptionRequest {
  customer_email: string;
  amount_in_cents: number;
  currency: string;
  reference: string;
  payment_method: {
    type: string;
    token: string;
  };
  recurring_period: {
    interval: 'MONTHLY';
    interval_count: number;
  };
}

// Wompi API Client
export class WompiClient {
  private baseUrl: string;
  private privateKey: string;

  constructor() {
    this.baseUrl = WOMPI_CONFIG.baseUrl;
    this.privateKey = WOMPI_CONFIG.privateKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.privateKey}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wompi API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Create a subscription
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<WompiSubscription> {
    return this.makeRequest<WompiSubscription>(
      '/subscriptions',
      'POST',
      request
    );
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<WompiSubscription> {
    return this.makeRequest<WompiSubscription>(
      `/subscriptions/${subscriptionId}`
    );
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<WompiSubscription> {
    return this.makeRequest<WompiSubscription>(
      `/subscriptions/${subscriptionId}`,
      'DELETE'
    );
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string): Promise<WompiSubscription> {
    return this.makeRequest<WompiSubscription>(
      `/subscriptions/${subscriptionId}/pause`,
      'POST'
    );
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<WompiSubscription> {
    return this.makeRequest<WompiSubscription>(
      `/subscriptions/${subscriptionId}/resume`,
      'POST'
    );
  }

  // Get transaction details
  async getTransaction(transactionId: string) {
    return this.makeRequest(`/transactions/${transactionId}`);
  }
}

// Helper functions
export function getPlanPriceInCents(plan: UserPlan): number {
  return PLAN_PRICES[plan] * 100; // Convert to cents
}

export function createSubscriptionReference(
  userId: string,
  plan: UserPlan
): string {
  return `cursia-${plan.toLowerCase()}-${userId}-${Date.now()}`;
}

export function parseWompiWebhook(
  body: string,
  signature: string
): WompiWebhookEvent {
  // Verify webhook signature using the Events secret
  const crypto = require('crypto');
  const secret = process.env.WOMPI_EVENTS_SECRET || WOMPI_CONFIG.webhookSecret;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }

  return JSON.parse(body);
}

// Create Wompi client instance
export const wompiClient = new WompiClient();
