#!/usr/bin/env node

/**
 * Error Boundary Verification Script
 *
 * This script verifies that the ErrorBoundary component has been properly
 * integrated into the application by checking:
 * 1. The component file exists
 * 2. The component is imported in the layout
 * 3. The component wraps the children
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Error Boundary Implementation...\n');

const checks = [
  {
    name: 'ErrorBoundary component exists',
    file: path.join(__dirname, 'src/components/error-boundary.tsx'),
    required: true,
  },
  {
    name: 'ErrorBoundary is imported in layout',
    file: path.join(__dirname, 'src/app/layout.tsx'),
    search: "import ErrorBoundary from",
    required: true,
  },
  {
    name: 'ErrorBoundary wraps children in layout',
    file: path.join(__dirname, 'src/app/layout.tsx'),
    search: '<ErrorBoundary>',
    required: true,
  },
  {
    name: 'Verification documentation exists',
    file: path.join(__dirname, 'ERROR_BOUNDARY_VERIFICATION.md'),
    required: false,
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  try {
    if (check.file) {
      const exists = fs.existsSync(check.file);
      if (!exists) {
        console.log(`❌ ${check.name} - File not found: ${check.file}`);
        if (check.required) failed++;
        return;
      }

      if (check.search) {
        const content = fs.readFileSync(check.file, 'utf-8');
        if (!content.includes(check.search)) {
          console.log(`❌ ${check.name} - Pattern not found: ${check.search}`);
          if (check.required) failed++;
          return;
        }
      }

      console.log(`✅ ${check.name}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    if (check.required) failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✨ All critical checks passed! Error Boundary is properly integrated.');
  console.log('\n📝 Testing the Error Boundary:');
  console.log('   1. Ensure your .env file has valid Clerk and Convex credentials');
  console.log('   2. Start the dev server: pnpm dev');
  console.log('   3. Create a component that throws an error to test');
  console.log('   4. See ERROR_BOUNDARY_VERIFICATION.md for detailed instructions');
  process.exit(0);
} else {
  console.log('\n⚠️  Some critical checks failed. Please review the implementation.');
  process.exit(1);
}
