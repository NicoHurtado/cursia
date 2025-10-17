import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1' } })),
}));
import { GET as communityGet } from '@/app/api/community/route';

// Mock Prisma db
vi.mock('@/lib/db', () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(async () => ({ plan: 'EXPERTO' })),
      },
      course: {
        findMany: vi.fn(async () => []),
        count: vi.fn(async () => 0),
      },
    },
  };
});

function makeRequest(url: string) {
  return new Request(url, { method: 'GET' }) as any;
}

describe('GET /api/community', () => {
  it('returns empty list and canAccessCommunity true for EXPERTO', async () => {
    const url = 'https://example.org/api/community?page=1&limit=10';
    const res = await communityGet(makeRequest(url));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.courses).toEqual([]);
    expect(json.pagination.total).toBe(0);
    expect(json.canAccessCommunity).toBe(true);
  });
});
