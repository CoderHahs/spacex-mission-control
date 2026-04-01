# Requirements Document

## Introduction

This document defines the requirements for the Rosetta Product Landing Page feature. The feature introduces a product-quality landing page for unauthenticated web users visiting the Rosetta Vercel deployment, while authenticated users and native platform users (Tauri/Capacitor) bypass the landing page and access the editor directly. The implementation uses state-based routing via an AuthGate component, GitHub OAuth for authentication, and lazy loading for bundle isolation between the landing page and editor.

## Glossary

- **AuthGate**: A top-level React routing component that renders either the LandingPage or the EditorApp based on authentication state and platform detection.
- **LandingPage**: A lazy-loaded React component displaying the product landing page with hero section, feature grid, download CTAs, and sign-in button.
- **EditorApp**: The existing Rosetta editor application tree including CryptoProvider, LockScreen, sidebar, CodeMirror editor, graph view, and command palette.
- **Platform_Detector**: A utility function (`detectPlatform()`) that identifies the runtime platform as "web", "tauri", or "capacitor".
- **CredentialStorageAdapter**: An existing service that stores and retrieves encrypted credentials using WebCrypto AES-GCM.
- **OAuth_Callback**: The process of handling the `?code=` URL parameter returned by GitHub after OAuth authorization, exchanging it for an access token, and storing the token.
- **StoredAuthToken**: A data object containing `accessToken`, `tokenType`, `scope`, and `createdAt` fields representing a persisted GitHub OAuth token.
- **FeatureGrid**: A responsive grid component displaying feature cards highlighting Rosetta capabilities.
- **DownloadSection**: A component rendering download CTAs for macOS (.dmg) and iOS (TestFlight) native apps.
- **LandingHero**: The hero section component with animated gradient background, tagline, and primary sign-in CTA.
- **LandingFooter**: A minimal footer component with GitHub repo link and branding.

## Requirements

### Requirement 1: Platform Detection

**User Story:** As a Rosetta user, I want the app to detect my runtime platform, so that native platform users are routed directly to the editor without seeing the landing page.

#### Acceptance Criteria

1. WHEN the application starts in a Tauri environment (where `window.__TAURI__` is defined), THE Platform_Detector SHALL return platform "tauri" with `isNative: true` and `isWeb: false`.
2. WHEN the application starts in a Capacitor environment (where `Capacitor.isNativePlatform()` returns true), THE Platform_Detector SHALL return platform "capacitor" with `isNative: true` and `isWeb: false`.
3. WHEN the application starts in a standard browser environment without Tauri or Capacitor globals, THE Platform_Detector SHALL return platform "web" with `isNative: false` and `isWeb: true`.
4. THE Platform_Detector SHALL return exactly one platform type where `isNative` and `isWeb` are mutually exclusive.
5. WHEN both Tauri and Capacitor globals are present, THE Platform_Detector SHALL prioritize Tauri detection over Capacitor.
6. IF the platform detection globals (`window.__TAURI__`, `Capacitor`) are undefined in an unexpected environment, THEN THE Platform_Detector SHALL default to platform "web".

### Requirement 2: Authentication State Management

**User Story:** As a web user, I want the app to check my authentication state on load, so that I am routed to the correct view without unnecessary delays.

#### Acceptance Criteria

1. WHEN the AuthGate mounts on a web platform, THE AuthGate SHALL check for a stored OAuth token via the CredentialStorageAdapter.
2. WHEN the CredentialStorageAdapter returns a valid StoredAuthToken with a non-empty `accessToken`, THE AuthGate SHALL set `isAuthenticated` to `true`.
3. WHEN the CredentialStorageAdapter returns null or a StoredAuthToken with an empty `accessToken`, THE AuthGate SHALL set `isAuthenticated` to `false`.
4. WHILE the auth token check is in progress, THE AuthGate SHALL display a loading state and render neither the LandingPage nor the EditorApp.
5. IF the CredentialStorageAdapter throws an error during token retrieval (e.g., WebCrypto decryption failure, IndexedDB corruption), THEN THE AuthGate SHALL treat the user as unauthenticated and set `isAuthenticated` to `false`.

### Requirement 3: State-Based Routing

**User Story:** As a Rosetta user, I want to be routed to the correct view based on my platform and auth state, so that I have a seamless experience without manual navigation.

#### Acceptance Criteria

1. WHILE the Platform_Detector reports `isNative: true`, THE App SHALL render the EditorApp directly, bypassing the AuthGate and LandingPage entirely.
2. WHEN a web user is authenticated (valid token stored), THE AuthGate SHALL render the EditorApp (CryptoProvider, LockScreen, editor).
3. WHEN a web user is unauthenticated (no valid token), THE AuthGate SHALL render the LandingPage.
4. THE AuthGate SHALL render exactly one of LandingPage or EditorApp after loading completes, never both simultaneously and never neither.

### Requirement 4: OAuth Sign-In Flow

**User Story:** As an unauthenticated web user, I want to sign in with GitHub, so that I can access the Rosetta editor.

#### Acceptance Criteria

1. WHEN an unauthenticated user clicks the "Sign in with GitHub" button on the LandingPage, THE LandingPage SHALL redirect the browser to `/api/auth/github`.
2. WHEN the browser returns from GitHub OAuth with a `?code=` URL parameter, THE AuthGate SHALL exchange the authorization code for an access token via the existing Edge Function.
3. WHEN the token exchange succeeds, THE AuthGate SHALL store the resulting StoredAuthToken encrypted via the CredentialStorageAdapter.
4. WHEN the token is stored successfully, THE AuthGate SHALL set `isAuthenticated` to `true` and render the EditorApp.
5. WHEN the OAuth callback is processed, THE AuthGate SHALL remove the `?code=` parameter from the browser URL using `history.replaceState` without triggering a page reload.
6. IF the token exchange fails due to a network error or invalid authorization code, THEN THE AuthGate SHALL remain on the LandingPage with `isAuthenticated` set to `false` and log the error.
7. IF the OAuth callback is processed repeatedly (indicating a redirect loop from silent token storage failure), THEN THE AuthGate SHALL detect the loop using a sessionStorage flag and break the loop after one attempt, displaying an error message on the LandingPage.

### Requirement 5: Sign-Out

**User Story:** As an authenticated web user, I want to sign out, so that I can return to the landing page and my session is fully cleared.

#### Acceptance Criteria

1. WHEN a user invokes the sign-out action, THE AuthGate SHALL clear the stored OAuth token from the CredentialStorageAdapter (not just from React state).
2. WHEN sign-out completes, THE AuthGate SHALL set `isAuthenticated` to `false` and render the LandingPage.
3. THE AuthGate SHALL produce the same unauthenticated state after sign-out regardless of the prior authentication state (idempotent sign-out).

### Requirement 6: Landing Page Structure

**User Story:** As an unauthenticated web visitor, I want to see a polished product landing page, so that I understand Rosetta's features and can sign in or download native apps.

#### Acceptance Criteria

1. THE LandingPage SHALL render a LandingHero section containing the app name, tagline, description, a "Sign in with GitHub" CTA button, and a "Learn more" scroll indicator.
2. THE LandingPage SHALL render a FeatureGrid section displaying at least 4 feature cards (E2EE, graph view, bidirectional links, BYOC sync, command palette, cross-platform).
3. THE LandingPage SHALL render a DownloadSection with at least one download CTA linking to macOS (.dmg via GitHub Releases) and iOS (TestFlight invite).
4. THE LandingPage SHALL render a LandingFooter with a GitHub repository link and branding text.
5. WHEN a user clicks the "Learn more" scroll indicator in the LandingHero, THE LandingPage SHALL smooth-scroll to the FeatureGrid section.

### Requirement 7: Responsive Layout

**User Story:** As a web visitor on any device, I want the landing page to be fully responsive, so that it looks correct on mobile, tablet, and desktop screens.

#### Acceptance Criteria

1. THE FeatureGrid SHALL render in a 1-column layout on viewports below 640px, a 2-column layout between 640px and 1024px, and a 3-column layout above 1024px.
2. THE LandingPage SHALL use a mobile-first responsive design with breakpoints at 640px, 768px, and 1024px.

### Requirement 8: Visual Design and Animations

**User Story:** As a web visitor, I want the landing page to have a polished dark-theme aesthetic with smooth animations, so that the product feels premium and modern.

#### Acceptance Criteria

1. THE LandingHero SHALL render an animated gradient background using the dark color palette (#0a0a0f to #1a1a2e).
2. THE FeatureGrid SHALL apply glassmorphism card styling with `backdrop-filter: blur(16px)`, semi-transparent backgrounds, and subtle borders.
3. WHEN a user hovers over a feature card, THE FeatureGrid SHALL apply a translateY(-4px) transform and accent border color transition.
4. THE FeatureGrid SHALL trigger fade-in animations on feature cards as the user scrolls them into view using framer-motion `whileInView`.
5. THE LandingPage SHALL follow the existing CSS-per-component pattern (no Tailwind) with separate CSS files per landing sub-component.

### Requirement 9: Lazy Loading and Bundle Isolation

**User Story:** As a developer, I want the landing page and editor to be in separate code-split chunks, so that unauthenticated users do not load editor code and authenticated users do not load landing page code.

#### Acceptance Criteria

1. THE App SHALL load the LandingPage component via `React.lazy()` so that the LandingPage JavaScript and CSS reside in a separate build chunk from the EditorApp.
2. WHILE the LandingPage chunk is loading, THE App SHALL display a Suspense fallback loading indicator.
3. IF the LandingPage chunk fails to load due to a network error, THEN THE App SHALL catch the error via a React error boundary and display a fallback UI.
4. WHILE a user is authenticated or on a native platform, THE App SHALL not load the LandingPage chunk.

### Requirement 10: Token Data Validation

**User Story:** As a developer, I want OAuth tokens to be validated before storage, so that corrupted or incomplete tokens do not cause authentication errors.

#### Acceptance Criteria

1. THE AuthGate SHALL validate that the `accessToken` field of a StoredAuthToken is a non-empty string before storing the token.
2. THE AuthGate SHALL validate that the `createdAt` field of a StoredAuthToken is a valid Unix timestamp before storing the token.
3. THE AuthGate SHALL store the OAuth token encrypted via the existing CredentialStorageAdapter using WebCrypto AES-GCM.

### Requirement 11: E2EE Non-Interference

**User Story:** As a Rosetta user, I want the new authentication layer to not interfere with the existing E2EE encryption flow, so that my vault security remains intact.

#### Acceptance Criteria

1. THE AuthGate SHALL render the CryptoProvider as a child of the authenticated branch, preserving the existing CryptoProvider → LockScreen → Editor component hierarchy.
2. THE AuthGate SHALL not read, modify, or bypass the E2EE master password or vault encryption key derivation (PBKDF2 → AES-GCM) managed by the CryptoProvider.
3. THE OAuth token stored by the AuthGate SHALL use a separate storage key ("github_oauth") from the E2EE vault key in the CredentialStorageAdapter.

### Requirement 12: Security

**User Story:** As a security-conscious user, I want the OAuth flow to follow security best practices, so that my credentials are protected.

#### Acceptance Criteria

1. THE AuthGate SHALL store OAuth tokens encrypted via the CredentialStorageAdapter using WebCrypto AES-GCM, consistent with the existing PAT storage security model.
2. THE OAuth flow SHALL exchange the authorization code server-side via the Vercel Edge Function, ensuring the actual access token never appears in the browser URL.
3. THE sign-out action SHALL clear the token from the CredentialStorageAdapter persistent storage, not just from in-memory React state.
