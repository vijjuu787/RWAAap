const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/:userId/watchlist', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const assets = db.getWatchlist(userId);
    res.json({ assets, count: assets.length });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/:userId/watchlist/:assetId', (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const asset = db.getAssetById(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (db.isInWatchlist(userId, assetId)) {
      return res.status(409).json({ error: 'Asset already in watchlist' });
    }

    db.addToWatchlist(userId, assetId);
    res.status(201).json({ assetId, message: 'Asset added to watchlist' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add asset to watchlist' });
  }
});

router.delete('/:userId/watchlist/:assetId', (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!db.getAssetById(assetId)) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const removed = db.removeFromWatchlist(userId, assetId);
    if (!removed) {
      return res.status(404).json({ error: 'Asset not in watchlist' });
    }

    res.json({ assetId, message: 'Asset removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove asset from watchlist' });
  }
});

module.exports = router;
