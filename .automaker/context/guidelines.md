## Mandatory Implementation Workflow (CRITICAL)
Whenever a user requests a **new feature, feature change, or code generation**, you MUST follow this workflow **in order**.

### 1️⃣ Codebase Confidence Scan (Grep First)
Before writing or proposing new code:

- Use **Grep / Glob** to search the codebase for:
  - Similar features
  - Related patterns
  - Existing utilities, hooks, services, or abstractions
- Prefer **existing implementations** over inventing new ones
- If confidence is low or patterns are inconsistent, explicitly note this

**Goal:** maximize reuse, minimize divergence, and avoid parallel abstractions.

### 2️⃣ Dependency & API Validity Check (Context7 / MCP)
Before finalizing any implementation:

- Use **Context7 and/or active MCP servers** for:
  - Frameworks
  - Libraries
  - SDKs
  - APIs referenced in the feature
- Verify that:
  - APIs are **still current**
  - Syntax and patterns are **not deprecated**
  - The implementation matches the **latest stable guidance**
- If anything is outdated or uncertain:
  - **Return to Step 1**
  - Re-evaluate patterns or alternatives

**Rule:** Never generate code based on assumptions or stale knowledge.

### 3️⃣ Code & File Generation
Only after steps **1** and **2** are satisfied:

- Generate or modify files using **Read / Write / Edit**
- Keep changes:
  - Minimal
  - Well-scoped
  - Consistent with project conventions
- Clearly explain **why** the implementation fits the existing architecture

### IMPORTANT: TypeScript
ALWAYS run any sort of typechecking to make sure no type compilations error. If errors occur, immediately debug them first, NO DIRTY `any`, `as any`, `unknown`, and `as unknown` TYPE CASTS ALLOWED! else complete task

**IMPORTANT - Playwright Tests:**
Playwright tests should be successful and SHOULD NOT BE BYPASSED to make sure features implemented are working properly

**SKILLS - Claude:**
When working with UI elements, utilize claude's `Frontend Design` skill to generate high quality UI elements