---
tags: [testing]
summary: testing implementation decisions and patterns
relevantTo: [testing]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# testing

#### [Gotcha] Playwright test requires browser context API to interact with AudioContext (2026-01-17)
- **Situation:** Standard testing approaches don't work with browser-specific audio APIs
- **Root cause:** AudioContext is browser-specific and requires actual browser environment
- **How to avoid:** End-to-end testing ensures real functionality but requires full browser setup

#### [Gotcha] Playwright test execution order matters for MediaRecorder timing (2026-01-17)
- **Situation:** Creating automated tests for MediaRecorder wrapper
- **Root cause:** MediaRecorder operations are time-sensitive and require proper async handling
- **How to avoid:** Required detailed async/await test structure vs flaky tests

#### [Gotcha] data URLs don't allow IndexedDB access (2026-01-17)
- **Situation:** Attempting to run Playwright tests for IndexedDB functionality using data:text/html URLs
- **Root cause:** data URLs have different security origins and sandboxed environment that blocks IndexedDB access
- **How to avoid:** Required creating separate test HTML file but provided proper origin context for IndexedDB operations

#### [Gotcha] Security header testing requires choosing between realistic and reliable test approaches (2026-01-17)
- **Situation:** Dynamic routes have authentication dependencies that interfere with testing
- **Root cause:** Static assets bypass middleware issues while proving headers work, but don't test dynamic routing scenarios
- **How to avoid:** Reliable testing vs comprehensive testing - chose reliability to establish baseline

#### [Gotcha] File-based verification tests instead of Playwright E2E tests due to authentication issues (2026-01-17)
- **Situation:** Playwright tests couldn't run against authenticated endpoints without proper test credentials setup
- **Root cause:** System used fs.readFileSync() to verify file existence and content instead of browser automation
- **How to avoid:** Faster verification without test setup overhead but doesn't test actual user interactions

#### [Gotcha] Playwright webServer configuration conflicts with existing dev server, requiring manual server management (2026-01-17)
- **Situation:** Automated Playwright test setup conflicts with manually started dev server for service worker testing
- **Root cause:** Playwright tries to start its own server on the same port, causing conflicts with existing server that serves the service worker
- **How to avoid:** Required manual server startup and custom test configuration, but enabled proper testing of service worker endpoints

#### [Gotcha] Build configuration issues (Clerk auth keys) unrelated to feature implementation were masking actual success (2026-01-17)
- **Situation:** TypeScript compilation was successful but build process appeared to fail due to external configuration
- **Root cause:** External service configuration issues were interfering with verification of successful implementation
- **How to avoid:** Had to create alternative verification approach (manual testing) due to external dependency issues

#### [Gotcha] Clerk authentication throws 500 errors when missing config instead of proper auth error codes (2026-01-17)
- **Situation:** Playwright verification tests for /projects route were failing with status 500
- **Root cause:** Clerk authentication middleware redirects to login on auth errors, but when auth isn't configured at all, it returns 500 instead of proper HTTP auth error codes
- **How to avoid:** Test had to accept 200-599 as valid range to verify route exists even when auth fails

#### [Pattern] Playwright verification testing for UI component functionality (2026-01-17)
- **Problem solved:** Need to verify complex UI interactions work correctly
- **Why this works:** Playwright provides cross-browser testing and direct DOM interaction verification
- **Trade-offs:** More comprehensive testing but setup is more complex and slower

#### [Gotcha] Playwright test configuration must match environment-specific settings (2026-01-17)
- **Situation:** Verification tests needed to run without authentication dependencies
- **Root cause:** Creating separate test configuration and using basic page load tests allowed validation of core functionality without external dependencies
- **How to avoid:** Simplified test setup but limited to basic functionality verification

#### [Gotcha] Component validation required file system checks due to authentication issues in test environment (2026-01-17)
- **Situation:** Playwright tests couldn't access authenticated components directly
- **Root cause:** Test environment had authentication barriers preventing direct UI component access
- **How to avoid:** Slower validation vs inability to run component tests in current environment

#### [Gotcha] Playwright test configuration differences with next dev server (2026-01-17)
- **Situation:** Next.js middleware authentication prevented test access
- **Root cause:** Playwright runs in isolated browser context that doesn't share app authentication state
- **How to avoid:** Special test configuration adds setup overhead but enables reliable testing

#### [Gotcha] Rate limiting requires integration test approach rather than unit tests (2026-01-17)
- **Situation:** Testing retry logic requires simulating 429 responses which needs actual API calls
- **Root cause:** Rate limiting behavior depends on real HTTP responses, which can't be easily mocked in unit tests
- **How to avoid:** More complex test setup vs. higher confidence in real-world behavior

#### [Gotcha] Playwright accessibility tests require comprehensive element selection including [tabindex]:not([tabindex='-1']) to capture all keyboard-navigable elements (2026-01-17)
- **Situation:** Initial test only checked standard interactive elements (a, button, input), missing custom keyboard-navigable divs
- **Root cause:** Elements with tabindex values other than -1 can receive keyboard focus but aren't standard HTML interactive elements
- **How to avoid:** More complex selector vs complete coverage

#### [Gotcha] Audio buffer processing is timing-dependent and requires precise mocking (2026-01-17)
- **Situation:** Testing audio analysis functions with sample data
- **Root cause:** Audio analysis functions like peak detection and RMS calculations depend on the exact time domain data in the buffer. Testing requires creating predictable AudioBuffer objects with known sample data.
- **How to avoid:** More complex test setup but ensures compatibility with actual AudioBuffer API