# Production-Grade Security, Role-Based Access Control (RBAC) & Editorial Architecture

Transform the Old Mango Tree webzine from a prototype with hardcoded credentials into a secure, enterprise-grade publishing and subscriber platform. This design covers access control, editorial workflows, idle session termination, secure 1-tap authentication (Passkeys/WebAuthn), and data integrity.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Choices Needing Feedback:**
> 1. **Authentication Provider**: Do you prefer an integrated self-hosted auth engine (using NextAuth.js / Auth.js with encrypted JWT cookies) or a managed provider (e.g., Supabase Auth, Firebase Auth, or Google Workspace SSO for `@oldmangotree.media`)?
> 2. **Staff Two-Factor Authentication (2FA)**: Should 2FA (TOTP authenticator app or email OTP) be strictly mandatory for the Editorial Desk?
> 3. **Draft Workflow**: Should staff writers/contributors be restricted to saving drafts that require senior editor approval before going live, or should all staff retain immediate publishing rights?

---

## Open Questions

> [!NOTE]
> - **Session Inactivity Window**: Our recommended default is **30 minutes of inactivity** for Editorial Desk staff (with auto-draft saving and a 2-minute countdown warning) and **30 days** for Subscribers who check "Remember Me". Does this window match your editorial team's habits?
> - **Easy Login Consent**: Do you prefer modern biometric Passkeys (Fingerprint / Face ID / Windows Hello) or a traditional "Remember this device for 30 days" checkbox, or both?

---

## System Design & Architecture

### 1. Role-Based Access Control (RBAC) Matrix

Instead of a binary `publisher` vs. `reader` model, the media platform requires distinct role-specific views and permission boundaries:

```
[ Visitor / Public ] ──> Public Articles & Free Previews
         │
         ├──> [ Subscriber / Digital Member ] ──> Member Lounge, Saved Library, Audio Stories, Ad-Free Reading
         │
         ├──> [ Contributing Writer / Columnist ] ──> Story Drafting, Personal Article History (Drafts Only)
         │
         ├──> [ Desk Editor ] ──> Review Queue, Proofing, Publishing, Category Assignment
         │
         └──> [ Publisher Admin / Editor-in-Chief ] ──> Full Desk, Issue Bundling, User Roles, Analytics, Takedowns
```

| Role | Target Route | Core Permissions | Restrictions |
| :--- | :--- | :--- | :--- |
| **Reader / Subscriber** | `/member` | Access paywalled webzines, save bookmarks, audio stories, submit letters to editor | Strictly blocked from `/publisher` and drafting APIs |
| **Contributor / Columnist** | `/publisher/drafts` | Compose Malayalam/English stories, save drafts, submit for review, upload draft media | Cannot publish directly to live site; cannot delete other authors' stories |
| **Section / Desk Editor** | `/publisher` | Review drafts, approve & publish stories, schedule releases, manage categories | Cannot manage staff accounts or change core publication settings |
| **Publisher Admin / EIC** | `/publisher/admin` | Full editorial control, issue packet curation, delete articles, staff user management, system audit logs | Unrestricted administrative power |

---

### 2. Session Inactivity, Timeout & Storage Architecture

#### Inactivity Timeout Policy
* **Editorial Desk Staff (`publisher`, `editor`, `admin`)**:
  - **Inactivity Limit**: **30 minutes** of zero keyboard/mouse interaction.
  - **Warning Threshold**: At 28 minutes, a modal prompt appears: *"Your session will expire in 2 minutes due to inactivity. Keep working?"*
  - **Graceful Lock & Auto-Save**: When the timer expires, the editor auto-saves any active draft to local encrypted cache and locks the screen to prevent unauthorized access if an editor leaves their computer unattended.
* **Subscribers (`reader`)**:
  - Session lasts **30 days** if *"Keep me signed in on this device"* was selected, or ends when the browser is closed (session-only cookie) if unselected.

#### Explicit Consent for Storing Information
* **No Silent Auto-Login**: The system will never store credentials or keep users signed in without explicit user action.
* **Login Form Controls**:
  - A clear checkbox: `[ ] Remember this device for 30 days (Recommended only on personal devices)`.
  - Informative tooltip: *"Do not check this on shared computers or internet cafes."*
* **Modern 1-Tap Experience via WebAuthn / Passkeys**:
  - Replace the insecure hardcoded buttons with **Passkeys** (Apple Touch ID, Android Biometrics, Windows Hello).
  - After logging in with password the first time, prompt: *"Enable 1-Tap Biometric Sign-In on this device?"*
  - Next time, clicking "1-Tap Editorial Sign-In" verifies the editor's physical biometric or security key via the browser's native WebAuthn API—verifying the exact device securely.

---

### 3. Security Hardening & Data Protection

1. **Elimination of Prototype Artifacts**:
   - Completely remove `STATIC_AUTH_ACCOUNTS` and plaintext passwords from client-side bundles.
   - Strip hardcoded preset buttons from `publisher/page.tsx` and `AuthModal.tsx`.
2. **Cryptographic Tokens (Signed HTTP-Only Cookies)**:
   - Stop using unencrypted Base64 JSON tokens in `localStorage`.
   - Store sessions in `HttpOnly`, `Secure`, `SameSite=Strict` cookies signed with an HMAC-SHA256 server secret (e.g. NextAuth JWT). This prevents Cross-Site Scripting (XSS) from reading tokens.
3. **Password Security**:
   - Hash all passwords with **Argon2id** or **bcrypt** with a work factor of 12+.
4. **Brute Force & Rate Limiting**:
   - Implement rate-limiting on `/api/auth` (e.g., maximum 5 failed attempts per 15 minutes per IP before a temporary lockout).
5. **Audit Logging**:
   - Log critical actions in an audit log (e.g., `article_published`, `article_deleted`, `issue_released`, `role_changed`) with author ID, timestamp, and IP address.

---

## Proposed Changes

Grouped by layer and component:

### Auth & Security Core

#### [MODIFY] [auth.ts](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/lib/auth.ts)
- Replace plaintext password comparisons with `bcrypt` / `argon2`.
- Replace raw Base64 JSON tokens with cryptographically signed JWT cookies (`HttpOnly`, `Secure`, `SameSite=Lax`).
- Add strict role checking (`requireRole(['admin', 'publisher'])`).

#### [MODIFY] [clientAuth.ts](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/lib/clientAuth.ts)
- Remove `STATIC_AUTH_ACCOUNTS` and hardcoded credentials.
- Add WebAuthn / Passkey helper functions for secure 1-tap biometric login.
- Add idle inactivity tracking hook (`useIdleTimer`) that detects 30 minutes of inactivity and fires a lock event.

#### [MODIFY] [route.ts (api/auth)](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/app/api/auth/route.ts)
- Implement rate limiting (IP-based and account-based).
- Support `"rememberMe"` boolean flag to control session cookie `maxAge` (Session vs. 30 days).
- Add session heartbeat endpoint `/api/auth/ping` to refresh valid sessions during active typing.

---

### Editorial Desk & UI Views

#### [MODIFY] [publisher/page.tsx](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/app/publisher/page.tsx)
- Remove the hardcoded 1-Tap preset login buttons.
- Add "Remember Me" checkbox and Passkey / Biometric login trigger.
- Add idle session warning modal (countdown timer with "Stay Logged In" button).
- Add auto-save draft functionality (saving state every 30 seconds into indexedDB / draft storage).
- Separate views by role: Contributor View (drafts only) vs. Editor View (publish / delete / issue packets).

#### [MODIFY] [AuthModal.tsx](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/components/AuthModal.tsx)
- Remove hardcoded 1-tap test credentials.
- Add "Remember this device" checkbox.
- Offer biometric / Passkey one-tap login for devices that have already been enrolled by the user.

#### [NEW] [SessionTimeoutModal.tsx](file:///c:/Desktop/Netwokzsystems/oldmangotree-NEW/oldMangoTree/src/components/SessionTimeoutModal.tsx)
- Reusable warning modal that triggers when an authenticated editor is idle for 28 minutes.
- Allows 1-click session extension or locks the editor screen cleanly.

---

## Verification Plan

### Automated / Unit Tests
1. **Password Hashing**: Verify passwords are salted and hashed (bcrypt/argon2) and rejected when incorrect.
2. **Token Tampering Prevention**: Verify that forged bearer tokens or altered roles in client storage return `401 Unauthorized`.
3. **Session Expiry**: Test that expired JWT cookies return `401` and force a redirect to login.
4. **Rate Limiting**: Test that 6 consecutive bad login attempts trigger a 429 Too Many Requests response.

### Manual Verification
1. **Idle Timeout Simulation**: Set idle timeout to 1 minute in development; verify that the warning modal pops up after 50 seconds and locks after 60 seconds with draft auto-saved.
2. **"Remember Me" Consent**: Verify that logging in without "Remember Me" clears the session when the browser tab/window is restarted, while logging in with "Remember Me" persists for 30 days.
3. **RBAC Isolation**: Verify that a user with the `reader` role attempting to access `/api/publish` or `/publisher` receives an access denied error.
4. **Production Build Cleanliness**: Check client JavaScript bundles to ensure zero traces of passwords or developer bypass accounts exist.
