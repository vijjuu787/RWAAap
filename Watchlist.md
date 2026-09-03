# Watchlist / Favorites — Implementation Notes

## What was built

**Backend** (`src/server/`)

- `models/database.js`: added a `watchlists` map (`userId -> Set<assetId>`) to the existing in-memory `MockDatabase`, plus `getUserById`, `getWatchlist`, `isInWatchlist`, `addToWatchlist`, `removeFromWatchlist`.
- `routes/watchlist.js`: new router mounted at `/api/users` in `server.js`, implementing the three requested endpoints:
  - `GET /api/users/:userId/watchlist` → `{ assets, count }` (full asset objects, so the frontend can render a favorites list without a second round trip)
  - `POST /api/users/:userId/watchlist/:assetId` → `201` on success
  - `DELETE /api/users/:userId/watchlist/:assetId` → `200` on success
  - Validation: 404 for unknown user, 404 for unknown asset, 409 for a duplicate favorite, 404 when removing something not in the list.
- `tests/watchlist.test.js`: supertest coverage for the happy path and each error case, following the pattern of the existing (currently unwired — see Trade-offs) test files.

**Frontend** (`src/`)

- `store/watchlistStore.ts`: new Zustand store (`favoriteIds: Set<string>`, `loading`, `error`) with `fetchWatchlist`, `isFavorite`, `toggleFavorite`. Favoriting/unfavoriting is optimistic — the UI flips immediately and rolls back if the API call fails.
- `components/AssetCard.tsx`: heart button overlaid on the image (top-right), filled red when favorited. Click is `stopPropagation`'d so it doesn't also trigger quick-view.
- `pages/MarketplacePage.tsx`: a "Favorites" toggle button in the toolbar that filters the grid to only favorited assets; fetches the watchlist on mount.
- `components/layout/Header.tsx`: heart icon + live favorite count, linking to the marketplace.

## Trade-offs (given the 2–3 hr scope)

- **No real auth, so no real per-user identity.** The frontend pins all watchlist calls to a hardcoded `CURRENT_USER_ID = 'user1'` (the one user already seeded in the mock DB), matching the task's "no real database or auth" boundary. A production version would derive this from a session/JWT.
- **Two disconnected asset sources.** The marketplace grid renders from a frontend-only `mockDataStore` (ids like `re1`, `j1`), while the backend's mock DB originally had its own smaller seeded set (ids `1`–`5`). This mismatch pre-dates this change and initially caused the first 2–4 cards to fail to favorite with a 404. Patched by adding the 4 missing ids (`re1`, `re2`, `j1`, `j2`) to the backend's seed data in `database.js` so every asset currently shown in the marketplace can be favorited end-to-end. The deeper fix — pointing the marketplace at `GET /api/assets` instead of the frontend-only mock store, so there's a single source of truth — is a larger, separate refactor and still worth doing.
- **Failed toggle is silent.** On a 404/409/network error the heart just reverts; there's no toast. The app's existing `toast` util is a blocking `alert()`, which felt worse than no feedback for this interaction.
- **Watchlist state isn't shared reactively between tabs/route remounts beyond the Zustand store's lifetime** — no localStorage/SSE, per the "out of scope" list.

## What I'd improve with more time

1. Wire the marketplace to the real `GET /api/assets` endpoint so every asset is favoritable, not just the 5 that happen to share an id with the seed data.
2. Add a lightweight, non-blocking toast for failed favorite/unfavorite actions.
3. Add a `DELETE`-idempotent option (return 200 instead of 404 when removing something already absent) if the product wants "remove" to be a no-op rather than an error — currently treated as a real error per the task's validation requirement.
4. Frontend tests (React Testing Library) for `AssetCard`'s favorite toggle and the store's optimistic-rollback behavior.
5. Actually wire up `npm test` — the repo has `jest`/`supertest` installed and existing spec files, but there's no `test` script in `package.json` and no jest config, so none of the test files (including the new one) currently run via `npm test`. I ran the new suite directly with `npx jest tests/watchlist.test.js` to validate it.

## Verification performed

- Exercised all three endpoints directly with `curl` (success, 404 user, 404 asset, 409 duplicate, 404 remove-not-present).
- Drove the actual running app in a real Chrome instance via Playwright: favorited an asset, confirmed the header count updated, reloaded the page and confirmed the favorite persisted (proving it round-trips through the backend, not just local state), applied the Favorites filter and confirmed only the favorited asset remained, then unfavorited and confirmed it disappeared from the filtered view. Zero console errors throughout.
