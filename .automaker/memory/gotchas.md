---
tags: [gotchas]
summary: gotchas implementation decisions and patterns
relevantTo: [gotchas]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 11
  referenced: 11
  successfulFeatures: 11
---
# gotchas

#### [Gotcha] CSP configuration must balance security with Next.js development requirements (2026-01-17)
- **Situation:** Next.js in development mode needs unsafe-inline and unsafe-eval for hot reloading and certain frameworks
- **Root cause:** Development tools rely on eval and inline scripts, making strict CSP impossible during dev
- **How to avoid:** Development vs production security posture differs - need separate strategies

#### [Gotcha] Next.js with authentication (Clerk) prevents offline page access due to auth middleware redirects (2026-01-17)
- **Situation:** Created offline fallback page but authentication system blocks it when user is offline
- **Root cause:** Clerk auth middleware checks user session before allowing access to routes, which fails when offline
- **How to avoid:** Had to modify test to check for route existence rather than content rendering

#### [Gotcha] Video element requires both ref and proper event handling for controls to work (2026-01-17)
- **Situation:** Trying to control video playback without proper ref management
- **Root cause:** Missing ref or incorrect event handling would make all controls non-functional
- **How to avoid:** Cleaner code structure, but requires additional setup

#### [Gotcha] Audio context issues with automatic volume control (2026-01-17)
- **Situation:** Trying to control video volume automatically
- **Root cause:** Browsers have restrictions on automatic audio playback and volume changes without user interaction
- **How to avoid:** Cannot implement auto-volume features without user interaction

#### [Gotcha] Video codec detection is unreliable across browsers due to inconsistent MediaTrackSettings (2026-01-17)
- **Situation:** Need to validate video codecs to ensure playback compatibility
- **Root cause:** Falling back to HTMLVideoElement.getVideoPlaybackQuality() and video codecs array provides more reliable detection than MediaTrackSettings
- **How to avoid:** Less precise codec detection but broader browser compatibility

#### [Gotcha] File accept attribute doesn't actually prevent file selection (2026-01-17)
- **Situation:** HTML file input accept attribute only provides client-side hints, not actual blocking
- **Root cause:** Browser security prevents blocking file selection entirely - must implement custom validation
- **How to avoid:** Custom validation adds complexity but ensures data integrity