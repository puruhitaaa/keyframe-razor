---
tags: [auth]
summary: auth implementation decisions and patterns
relevantTo: [auth]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# auth

#### [Pattern] Dual verification pattern in Convex functions (getUserIdentity + userId) (2026-01-17)
- **Problem solved:** Each function checks both getIdentity() and userId from Clerk auth
- **Why this works:** Prevents security holes where functions might be callable without proper authentication
- **Trade-offs:** Stronger security adds slight performance overhead but is critical for data isolation

#### [Gotcha] Authentication failures don't prevent page structure from loading in Next.js (2026-01-17)
- **Situation:** Even with auth errors, Next.js still renders the page skeleton, making verification tricky
- **Root cause:** Next.js Server Components can render static structure even if data fetching fails
- **How to avoid:** More robust error handling needed to distinguish between auth failures and missing routes