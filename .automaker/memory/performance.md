---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# performance

#### [Gotcha] HTMLVideoElement metadata extraction is async and timeout-sensitive (2026-01-17)
- **Situation:** Video validation needed to extract duration/codec metadata without blocking the UI
- **Root cause:** Using setTimeout with HTMLVideoElement.load() followed by metadata check avoids UI blocking while ensuring the validation completes
- **How to avoid:** Async approach maintains UI responsiveness but requires timeout handling and state management

#### [Pattern] URL.revokeObjectURL() for memory management (2026-01-17)
- **Problem solved:** File objects create object URLs that persist in memory
- **Why this works:** Without cleanup, each upload creates persistent memory references leading to memory leaks
- **Trade-offs:** More complex cleanup logic but prevents memory leaks in long-running applications

#### [Gotcha] Memory leaks from unreleased object URLs (2026-01-17)
- **Situation:** URL.createObjectURL() creates persistent references that cause memory accumulation
- **Root cause:** Automatic URL revocation in cleanup prevents memory leaks during extraction
- **How to avoid:** Cleanup logic adds overhead but prevents critical memory issues

#### [Pattern] Lazy evaluation of analysis and waveform generation (2026-01-17)
- **Problem solved:** Large audio files can be hundreds of megabytes in memory
- **Why this works:** Not all users need analysis or waveform data immediately. By making these optional and computed on demand, we reduce memory pressure and processing time.
- **Trade-offs:** Adds complexity to async functions but dramatically improves performance for simple metadata extractions