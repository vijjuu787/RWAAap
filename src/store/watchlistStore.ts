import { create } from 'zustand';
import axios from 'axios';
import { Asset } from '@/types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// Auth isn't wired to the backend yet (out of scope for this task), so we pin the
// watchlist to the seeded demo user that already exists in the mock database.
export const CURRENT_USER_ID = 'user1';

interface WatchlistState {
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  fetchWatchlist: () => Promise<void>;
  isFavorite: (assetId: string) => boolean;
  toggleFavorite: (assetId: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  favoriteIds: new Set(),
  loading: false,
  error: null,
  hasLoaded: false,

  fetchWatchlist: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get<{ assets: Asset[] }>(
        `${API_BASE_URL}/users/${CURRENT_USER_ID}/watchlist`
      );
      set({
        favoriteIds: new Set(data.assets.map(asset => asset.id)),
        loading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({ error: 'Failed to load watchlist', loading: false, hasLoaded: true });
    }
  },

  isFavorite: (assetId: string) => get().favoriteIds.has(assetId),

  toggleFavorite: async (assetId: string) => {
    const wasFavorite = get().favoriteIds.has(assetId);

    set(state => {
      const next = new Set(state.favoriteIds);
      wasFavorite ? next.delete(assetId) : next.add(assetId);
      return { favoriteIds: next, error: null };
    });

    try {
      if (wasFavorite) {
        await axios.delete(`${API_BASE_URL}/users/${CURRENT_USER_ID}/watchlist/${assetId}`);
      } else {
        await axios.post(`${API_BASE_URL}/users/${CURRENT_USER_ID}/watchlist/${assetId}`);
      }
    } catch (error) {
      set(state => {
        const next = new Set(state.favoriteIds);
        wasFavorite ? next.add(assetId) : next.delete(assetId);
        return { favoriteIds: next, error: 'Failed to update watchlist' };
      });
    }
  },
}));
