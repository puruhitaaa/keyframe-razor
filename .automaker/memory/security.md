---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 1
  successfulFeatures: 1
---
# security

#### [Gotcha] User gesture detection must be implemented carefully to avoid false positives (2026-01-17)
- **Situation:** Browsers have specific requirements for what constitutes valid user interaction
- **Root cause:** Invalid gesture detection prevents proper audio context resumption
- **How to avoid:** More robust gesture detection vs. implementation complexity

#### [Gotcha] Playwright request context fails when testing security headers due to backend authentication middleware returning 500 errors (2026-01-17)
- **Situation:** Trying to verify security headers via Playwright test route that requires authentication, hitting Clerk middleware error
- **Root cause:** The combination of insecure HTTP (3001 vs 3000) and missing Clerk environment variables causes auth failures that prevent reaching routes where headers would be present
- **How to avoid:** Had to fall back to testing static assets (favicon) which bypass middleware but still prove headers work

### Used mixed security strategy combining modern CSP with legacy headers like X-XSS-Protection (2026-01-17)
- **Context:** Balancing comprehensive security with browser compatibility
- **Why:** Modern browsers fully support CSP, but legacy headers like X-XSS-Protection provide extra protection for older browsers while being mostly harmless
- **Rejected:** Pure modern approach would risk leaving gaps in older browser support
- **Trade-offs:** Slightly more complex configuration but broader protection across all supported browsers
- **Breaking if changed:** Removing legacy headers would reduce protection for users on older browser versions

#### [Gotcha] Content Security Policy (CSP) worker-src directive was blocking service worker registration (2026-01-17)
- **Situation:** Service workers failed to register due to restrictive CSP headers
- **Root cause:** Default Next.js CSP doesn't allow blob URLs for service worker scripts, causing registration failures
- **How to avoid:** Had to add specific CSP exception which slightly reduces security but enables PWA functionality

#### [Pattern] Client-side file validation before upload (2026-01-17)
- **Problem solved:** Prevent invalid files from reaching the server
- **Why this works:** Server-side validation is essential but client-side validation improves UX by catching errors early
- **Trade-offs:** Additional client-side validation logic but better user experience and reduced server load