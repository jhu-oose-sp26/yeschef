# Code Review

## Anna
- Description of the issue/inefficiency **File names in bold**
    - Detailed explanations of your improvements/refactorings

## Caroline
- Description of the issue/inefficiency **File names in bold**
    - Detailed explanations of your improvements/refactorings

## Joey
- Description of the issue/inefficiency **File names in bold**
    - Detailed explanations of your improvements/refactorings

## Julia

### 1. Duplicated color constants across all screens (DRY / Design)
- **Files affected:** `app/(tabs)/index.tsx`, `app/(tabs)/profile/index.tsx`, `app/(tabs)/profile/my-posts.tsx` (and 20+ other screen files)
- The same six color literals (`#1A1208`, `#B8D5B8`, `#05A8AA`, `#BC412B`, `#FFF8F2`, `#FFEDE2`) were copy-pasted as local `const` declarations into every single screen file. This violates the DRY (Don't Repeat Yourself) principle: if a brand color ever changes, a developer would need to hunt down and update 20+ files manually, with a high risk of missing one and introducing visual inconsistency (which had already started — `CREAM` had drifted to three slightly different hex values across files).
    - **Fix:** Created `frontend/constants/colors.ts` with a single exported `Colors` object holding all palette values. Updated `profile/index.tsx`, `my-posts.tsx`, and `index.tsx` (home feed) to import from it, replacing local constants. The remaining screens follow the same pattern and can be migrated incrementally.

### 2. `my-posts.tsx` made an extra API call on every card press (Complexity / Design)
- **Files affected:** `app/(tabs)/profile/my-posts.tsx`
- The screen previously called `getUserRecipes(userId)` to get a list of recipes, then — only when the user tapped a card — made a second network request `getPostByRecipeId(recipe.id)` to find the matching post and retrieve its ID for navigation. This meant every tap had a loading delay and could silently fail (falling back to the recipe detail route instead of the post). It also required maintaining `navigating` state per card just to show a spinner during that second fetch. The `getUserPosts` endpoint (added this iteration) already returns posts with their IDs directly.
    - **Fix:** Rewrote `my-posts.tsx` to call `getUserPosts(userId)` once on load. Cards now hold the `postId` directly, so tapping navigates immediately with no extra request. Removed the `getPostByRecipeId` import, the `navigating` per-card state, the `buildExcerpt` helper, and the `ActivityIndicator` inside each card. The component is roughly 80 lines shorter and the logic is straightforward. Post notes are shown as the excerpt since they are now available directly from the response.

### 3. Loading/error UI copy-pasted into every screen (Complexity / Style)
- **Files affected:** `components/ui/LoadingErrorView.tsx` (new), `app/(tabs)/profile/my-posts.tsx`
- Every screen contained the same three-state pattern: a centered `ActivityIndicator` while loading, a centered error message with a Retry `Pressable` on failure, and the actual content on success. The loading spinner, error text style, and retry button style were duplicated identically (or near-identically) across the home feed, my-posts, my-saved, notifications, and profile screens — meaning a style change to the spinner color required touching every file separately.
    - **Fix:** Extracted the pattern into `frontend/components/ui/LoadingErrorView.tsx`. It accepts `loading`, `error`, `onRetry`, and `children` props and handles all three states internally. Applied it in `my-posts.tsx`, replacing ~20 lines of repeated JSX with a single wrapper. The same component can be adopted by the remaining screens with a one-line change each.

## Rad

### 1. `user-posts.tsx` still made a second API call on every card press (Complexity / Design)
- **Files affected:** `app/(tabs)/profile/user-posts.tsx`
- The screen previously loaded a user's recipes and then made a second request on every card tap just to find the matching post ID. That added unnecessary latency and made this flow inconsistent with `my-posts.tsx`, which had already been simplified.
    - **Fix:** Reworked `user-posts.tsx` to call `getUserPosts(userId)` once and store `FeedPost` objects directly. Cards now already know their `postId`, so navigation goes straight to the post with no second fetch. I also removed the temporary `navigating` state and reused post notes as the excerpt when available.

### 2. Profile screens were still duplicating loading/error UI and palette values (DRY / Style / Design)
- **Files affected:** `app/(tabs)/profile/user-posts.tsx`, `app/(tabs)/profile/my-saved.tsx`, `app/(tabs)/profile/my-friends.tsx`
- These screens each had their own copy of the same loading/error/retry structure, plus repeated local color constants. That increases maintenance cost and makes small UI changes harder to apply consistently.
    - **Fix:** Migrated these profile screens to use the shared `LoadingErrorView` component and the centralized `constants/colors.ts` palette. That reduced duplicate JSX and made the loading and retry behavior more consistent across the profile flow.

### 3. Frontend lint/style issues and debug leftovers were still present (Style / Naming / Tests)
- **Files affected:** `app/(tabs)/index.tsx`, `app/forgot-password.tsx`, `constants/api.ts`, `app/(tabs)/browse/ingredient.tsx`, `app/(tabs)/browse/time.tsx`, `app/(tabs)/browse/results.tsx`, `app/search/results.tsx`, `app/(tabs)/create.tsx`, `app/(tabs)/recipes/edit.tsx`
- The frontend still had several small quality issues: debug logging in API config, unused imports/variables, a React hook dependency warning, JSX text escaping errors, and a stale ESLint suppression comment. These are minor individually, but together they make the code less polished and add noise to reviews.
    - **Fix:** Cleaned up the unused imports/variables, removed the debug logging from `constants/api.ts`, fixed the hook dependency warning and JSX text escaping issues, and removed the unnecessary ESLint suppression. As verification, I ran `npm run lint` and got a clean pass afterward.
