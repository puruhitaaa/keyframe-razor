---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# architecture

### Singleton pattern for AudioContext management ensures single instance across entire application (2026-01-17)
- **Context:** AudioContext instances are expensive browser resources that should be shared
- **Why:** Multiple AudioContext instances waste resources and complicate audio routing
- **Rejected:** Multiple instances per component
- **Trade-offs:** Centralized control and resource efficiency vs. potential coupling
- **Breaking if changed:** Audio performance degradation and resource leaks with multiple instances

#### [Pattern] Event-driven state management for AudioContext lifecycle (2026-01-17)
- **Problem solved:** AudioContext state changes are asynchronous and need to be tracked across components
- **Why this works:** Components need to react to state changes without tight coupling
- **Trade-offs:** Decoupled reactive architecture vs. event listener management overhead

#### [Pattern] Separate base UI components from feature-specific logic (2026-01-17)
- **Problem solved:** Created reusable Dialog, Select, and RadioGroup components in ui/ directory
- **Why this works:** Components follow single responsibility principle - base UI handles presentation, feature component handles business logic
- **Trade-offs:** More file organization but better reusability and easier testing

#### [Pattern] Event-driven state management for MediaRecorder (2026-01-17)
- **Problem solved:** Designing wrapper API around native MediaRecorder events
- **Why this works:** MediaRecorder is inherently event-based, so wrapper should expose clean event interface
- **Trade-offs:** Cleaner API vs complexity of event subscription management

### Using Blob storage instead of chunked storage for initial implementation (2026-01-17)
- **Context:** Designing video storage system with chunked upload support requirements
- **Why:** Simpler API for most use cases, easier to implement and maintain, sufficient for typical video files
- **Rejected:** Full chunked storage implementation immediately which would be complex and error-prone
- **Trade-offs:** Faster to implement and simpler API design, but may face performance issues with very large video files
- **Breaking if changed:** Would need significant architectural changes to implement chunked storage properly

#### [Pattern] Global headers configuration via next.config.ts as single source of security truth (2026-01-17)
- **Problem solved:** Ensuring consistent security headers across all routes and static assets
- **Why this works:** Single configuration point prevents header inconsistencies and gaps in coverage
- **Trade-offs:** Centralized control vs flexibility - easier security auditing but less granular control

### Placeholder video URL storage instead of actual Convex file upload integration (2026-01-17)
- **Context:** Project schema includes storageId field but mutation uses placeholder URL
- **Why:** Avoided complex file storage setup during initial feature implementation to focus on core CRUD functionality
- **Rejected:** Full Convex storage integration with generateUploadUrl() - would require additional auth, storage provisioning, and file handling complexity
- **Trade-offs:** Easier initial development but placeholder URLs break video playback; actual storage requires significant additional setup
- **Breaking if changed:** Video playback functionality won't work without proper storage implementation

### Used Network First strategy with 5-second timeout for navigation requests instead of Cache First or Stale While Revalidate (2026-01-17)
- **Context:** Balancing offline functionality with fresh content - navigation requests need to be current but must fallback to cache when offline
- **Why:** Network First ensures users always get the latest version when online, with graceful fallback to cache after timeout prevents UI hanging on slow networks
- **Rejected:** Cache First was rejected because it would serve stale content to users who are online, Stale While Revalidate was rejected because it might still show outdated navigation content
- **Trade-offs:** Users get fresh content when connected but experience a brief delay on first load, and get cached version when network is slow/unavailable
- **Breaking if changed:** Changing to Cache First would break content freshness guarantees, changing to pure Network would break offline functionality entirely

#### [Pattern] Separate service worker file (public/sw.js) from registration hook (useServiceWorker) (2026-01-17)
- **Problem solved:** Decoupling service worker implementation from registration logic
- **Why this works:** Service worker needs to be in public folder for direct access, while registration needs to be part of React component lifecycle
- **Trade-offs:** Clean separation of concerns but requires manual file management and coordination between two different systems

### Created abstraction layers via custom hooks for video storage and audio context with toast integration (2026-01-17)
- **Context:** Needed to decouple toast notifications from business logic while maintaining consistent error handling across multiple components
- **Why:** Centralizing toast logic in hooks allows reuse across components, reduces code duplication, and provides consistent user experience
- **Rejected:** Inline toast calls in each component - would lead to inconsistent error handling and code duplication
- **Trade-offs:** Added abstraction layers which increase initial complexity but dramatically improve maintainability and consistency
- **Breaking if changed:** Removing these hooks would require manually updating toast calls in all dependent components and services

### Monorepo structure with separate backend Convex package prevents direct file imports from web app (2026-01-17)
- **Context:** Verification tests needed to check backend mutations but couldn't import backend code directly
- **Why:** Backend is isolated in its own package with separate dependencies and build process
- **Rejected:** Direct import of backend modules from web app
- **Trade-offs:** Forced filesystem-based verification instead of direct testing, but maintains proper package boundaries
- **Breaking if changed:** Backend refactor would break test implementation if file structure changes

### Single comprehensive component with internal state management (2026-01-17)
- **Context:** Need to manage complex video state and interactions
- **Why:** Keeping all video state (play/pause, volume, fullscreen, time) within a single component reduces prop drilling and maintains encapsulation
- **Rejected:** Splitting into smaller components would require complex prop drilling and context for shared state
- **Trade-offs:** Easier to maintain complete functionality, but creates a larger component (300+ lines)
- **Breaking if changed:** Splitting would require significant refactoring and state management changes

#### [Pattern] Two-stage validation (quick + detailed) provides immediate user feedback while maintaining thoroughness (2026-01-17)
- **Problem solved:** Video files can be large but validation needs to provide fast feedback to prevent user abandonment
- **Why this works:** Quick validation (format/size) runs synchronously for instant UI updates, while detailed validation (metadata) runs async with loading states
- **Trade-offs:** Increased implementation complexity but significantly improved user experience

### Wrapper pattern for third-party API integration (2026-01-17)
- **Context:** Integrating rate limiting into existing Convex client without modifying core Convex code
- **Why:** Allows transparent retry logic without requiring changes to existing Convex usage patterns or breaking the open-source contract
- **Rejected:** Modifying ConvexReactClient directly would require forking/patching and create maintenance overhead
- **Trade-offs:** Easier integration vs. potential performance overhead from wrapper indirection
- **Breaking if changed:** Removing the wrapper would break all retry logic and expose the application to 429 failures

### Dual extraction approach with quick vs full metadata methods (2026-01-17)
- **Context:** Need to balance performance vs completeness when extracting video metadata
- **Why:** Separate getBasicVideoMetadata() for quick info without loading video vs extractVideoMetadata() for full data
- **Rejected:** Single comprehensive method would always load video files unnecessarily
- **Trade-offs:** Utility functions become more complex but enable better performance optimization
- **Breaking if changed:** Consolidating methods would force all users to pay performance cost

### Skip links must use tabIndex={-1} to make them keyboard focusable while removing them from normal tab order (2026-01-17)
- **Context:** Need keyboard-only users to bypass repetitive navigation without interfering with normal tab flow
- **Why:** tabIndex={-1} allows programmatic focus via JavaScript when skip links are activated, but keeps them hidden from normal tab order until user activates them
- **Rejected:** Using display:none or visibility:hidden which would make them inaccessible to screen readers
- **Trade-offs:** Implementation complexity vs meeting WCAG 2.1 requirement G1 (Bypass Blocks)
- **Breaking if changed:** Users relying on keyboard navigation couldn't skip repetitive navigation sections

### Audio extraction utility implemented as pure functions with no side effects (2026-01-17)
- **Context:** Extracting audio data from video files using Web Audio API
- **Why:** Pure functions ensure predictable behavior, easier testing, and better error handling. Audio operations involve complex state management (AudioContext lifecycle, audio buffers) and pure functions make this more manageable.
- **Rejected:** Class-based approach with instance methods and mutable state would be more complex to test and harder to reason about error states
- **Trade-offs:** Easier testing and debugging, but requires careful parameter passing for configuration
- **Breaking if changed:** If functions become impure, audio extraction becomes unpredictable and harder to test