import { describe, it, expect, beforeEach } from 'vitest';
import { getPlanPriceInCents, createSubscriptionReference, parseWompiWebhook } from '@/lib/wompi';
import { UserPlan } from '@/lib/plans';

describe('wompi helpers', () => {
  it('getPlanPriceInCents converts correctly', () => {
    // Use known plan price map: just assert it is cents (multiple of 100)
    const cents = getPlanPriceInCents(UserPlan.APRENDIZ);
    expect(cents % 100).toBe(0);
    expect(cents).toBeGreaterThan(0);
  });

  it('createSubscriptionReference embeds user and plan', () => {
    const userId = 'user_123';
    const ref = createSubscriptionReference(userId, UserPlan.EXPERTO);
    expect(ref).toContain('experto');
    expect(ref).toContain(userId);
  });

  describe('parseWompiWebhook', () => {
    const crypto = require('crypto');

    beforeEach(() => {
      process.env.WOMPI_EVENTS_SECRET = 'secret';
    });

    it('validates signature and parses body', () => {
      const body = JSON.stringify({ event: 'transaction.updated', data: { transaction: { id: 't1', status: 'APPROVED', amount_in_cents: 1000, reference: 'r1', customer_email: 'a@b.com', payment_method_type: 'CARD', created_at: new Date().toISOString() } } });
      const signature = crypto.createHmac('sha256', 'secret').update(body).digest('hex');
      const event = parseWompiWebhook(body, signature);
      expect(event.event).toBe('transaction.updated');
      expect(event.data.transaction.id).toBe('t1');
    });

    it('throws on invalid signature', () => {
      const body = JSON.stringify({ event: 'x', data: { transaction: { id: 't1' } } });
      expect(() => parseWompiWebhook(body, 'bad')).toThrowError('Invalid webhook signature');
    });
  });
});


