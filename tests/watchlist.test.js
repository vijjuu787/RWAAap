const request = require('supertest');
const app = require('../src/server/server');

describe('Watchlist API', () => {
  const userId = 'user1'; // seeded in mock database
  const assetId = '1'; // seeded in mock database

  describe('GET /api/users/:userId/watchlist', () => {
    it('returns an empty watchlist for a valid user with no favorites', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/watchlist`)
        .expect(200);

      expect(res.body).toHaveProperty('assets');
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.assets)).toBe(true);
    });

    it('returns 404 for an unknown user', async () => {
      await request(app)
        .get('/api/users/does-not-exist/watchlist')
        .expect(404);
    });
  });

  describe('POST /api/users/:userId/watchlist/:assetId', () => {
    it('adds an asset to the watchlist', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/watchlist/${assetId}`)
        .expect(201);

      expect(res.body).toHaveProperty('assetId', assetId);

      const getRes = await request(app).get(`/api/users/${userId}/watchlist`).expect(200);
      expect(getRes.body.assets.some(asset => asset.id === assetId)).toBe(true);
    });

    it('rejects a duplicate favorite', async () => {
      await request(app)
        .post(`/api/users/${userId}/watchlist/${assetId}`)
        .expect(409);
    });

    it('returns 404 for an unknown asset', async () => {
      await request(app)
        .post(`/api/users/${userId}/watchlist/does-not-exist`)
        .expect(404);
    });

    it('returns 404 for an unknown user', async () => {
      await request(app)
        .post(`/api/users/does-not-exist/watchlist/${assetId}`)
        .expect(404);
    });
  });

  describe('DELETE /api/users/:userId/watchlist/:assetId', () => {
    it('removes an asset from the watchlist', async () => {
      await request(app)
        .delete(`/api/users/${userId}/watchlist/${assetId}`)
        .expect(200);

      const getRes = await request(app).get(`/api/users/${userId}/watchlist`).expect(200);
      expect(getRes.body.assets.some(asset => asset.id === assetId)).toBe(false);
    });

    it('returns 404 when removing an asset not in the watchlist', async () => {
      await request(app)
        .delete(`/api/users/${userId}/watchlist/${assetId}`)
        .expect(404);
    });
  });
});
