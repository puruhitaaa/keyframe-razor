---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 3
  referenced: 3
  successfulFeatures: 3
---
# api

#### [Gotcha] AudioContext requires explicit user gesture to resume due to browser autoplay policies (2026-01-17)
- **Situation:** Web Audio API won't work without explicit user interaction for security/privacy reasons
- **Root cause:** Browser security policies prevent automatic audio playback without user consent
- **How to avoid:** Must handle user gesture events and track state, but provides better user control

#### [Gotcha] MediaRecorder.onstop event fires after stop() completes, not during stop() (2026-01-17)
- **Situation:** Testing MediaRecorder wrapper functionality with Playwright
- **Root cause:** The stop() method returns a Promise that resolves when the MediaRecorder.onstop event fires
- **How to avoid:** Required async/await pattern for stop() method, making API more predictable

#### [Gotcha] Browser-specific MediaRecorder MIME type support varies significantly (2026-01-17)
- **Situation:** Testing format support detection across different browsers
- **Root cause:** Different browsers support different MIME types - Chrome/WebM vs Safari/MOV
- **How to avoid:** Increased complexity for format detection vs reliability

### Auto-detection of best MIME type based on browser capabilities (2026-01-17)
- **Context:** Designing format support detection system
- **Why:** Different browsers have different format support, auto-detection ensures maximum compatibility
- **Rejected:** Hard-coded format selection would fail in unsupported browsers
- **Trade-offs:** Increased complexity vs reliability across browsers
- **Breaking if changed:** Would reduce browser compatibility if hard-coded format is removed

#### [Pattern] Event-driven state management with progress tracking interface (2026-01-17)
- **Problem solved:** Building user-facing video storage API that needs to provide feedback during operations
- **Why this works:** Allows components to react to storage state changes and provide better UX with progress updates
- **Trade-offs:** More complex implementation but enables better user experience and component integration

#### [Gotcha] Pre-existing TypeScript compilation errors were blocking toast implementation progress (2026-01-17)
- **Situation:** Attempting to add toast functionality but build process was failing due to unrelated syntax errors
- **Root cause:** Missing component props and syntax issues prevented successful compilation, blocking testing of new features
- **How to avoid:** Fixing existing bugs delayed feature implementation but ensured stable foundation for new features

### Using existing projects.list query instead of new dedicated query for project listing (2026-01-17)
- **Context:** Projects page needed to list all user projects
- **Why:** Reused existing well-tested query rather than creating new one, reducing code duplication
- **Rejected:** Creating new dedicated projects.listProjects query
- **Trade-offs:** Slightly less domain-specific but leverages existing data fetching logic
- **Breaking if changed:** If existing query changes behavior, projects page might break unexpectedly

#### [Gotcha] 429 error detection requires Response headers parsing (2026-01-17)
- **Situation:** Convex API responses don't include HTTP status codes in error objects
- **Root cause:** Convex abstracts HTTP layer, so 429 errors come as generic ConvexError with specific error code structure
- **How to avoid:** More complex error detection logic vs. working within Convex's abstraction layer

#### [Pattern] Exponential backoff with jitter for distributed systems (2026-01-17)
- **Problem solved:** Preventing thundering herd problem when multiple clients retry simultaneously
- **Why this works:** Pure exponential backoff can synchronize retries, while jitter prevents coordinated failures
- **Trade-offs:** More complex calculation vs. better load distribution during outages

#### [Gotcha] Audio track enumeration API has inconsistent browser support (2026-01-17)
- **Situation:** Audio track detection using video.audioTracks API varies significantly across browsers
- **Root cause:** Built fallback codec-based detection to handle browsers with limited audioTracks API support
- **How to avoid:** Fallback logic adds complexity but ensures cross-browser compatibility

#### [Gotcha] AudioContext must be created in user interaction gesture due to browser autoplay policies (2026-01-17)
- **Situation:** AudioContext creation fails when not in response to user action
- **Root cause:** Modern browsers prevent automatic audio playback without user interaction. This requires timing AudioContext creation with the actual audio processing.
- **How to avoid:** Adds complexity to API design but necessary for browser compliance