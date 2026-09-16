# Cypress E2E Testing Setup for Blueprint

This document explains the Cypress End-to-End testing setup for the Blueprint construction management application.

## Overview

The Blueprint application now includes comprehensive E2E testing using Cypress, with programmatic authentication to avoid slow and unreliable UI-based login flows.

## Setup Components

### 1. Configuration Files

- **`cypress.config.cjs`**: Main Cypress configuration (CommonJS format for ES module compatibility)
- **`cypress/support/e2e.js`**: Support file with global hooks and error handling
- **`cypress/support/commands.js`**: Custom Cypress commands including `cy.login()`

### 2. Directory Structure

```
cypress/
├── e2e/
│   ├── auth.cy.js          # Authentication flow tests
│   └── quotes.cy.js        # Quotes CRUD functionality tests
├── fixtures/
│   └── (test data files)   # Test data fixtures
└── support/
    ├── commands.js         # Custom commands
    └── e2e.js             # Support file
```

### 3. Backend Test Endpoint

A new test-only endpoint has been added to `server.cjs`:

```javascript
POST /api/test/login
```

This endpoint:
- Creates or finds a test user (`test@blueprint.com`)
- Sets up a proper session cookie
- Returns user data for verification
- Only works in development environment

## Test Features

### Programmatic Login

Instead of clicking through Google OAuth UI (which is slow and unreliable), tests use:

```javascript
cy.login() // Custom command that makes direct API call
```

This approach:
- ✅ Faster execution (no UI interactions)
- ✅ More reliable (no third-party dependencies)
- ✅ Easier to maintain
- ✅ Works in CI/CD environments

### Comprehensive Auth Flow Testing

The `auth.cy.js` test file includes:

1. **Login/Logout Flow Test**
   - Verifies starting state (public landing page)
   - Performs programmatic login
   - Confirms user is authenticated (name visible, API access)
   - Performs logout
   - Verifies return to public state

2. **Session Persistence Test**
   - Logs in user
   - Refreshes page
   - Confirms authentication persists

3. **Unauthorized Access Test**
   - Attempts to access protected routes without auth
   - Verifies proper security behavior

## Running Tests

### Interactive Mode (Recommended for Development)

```bash
npm run test:e2e:open
# or
npm run cypress:open
```

This opens the Cypress Test Runner with visual interface.

### Headless Mode (CI/CD)

```bash
npm run test:e2e
# or
npm run cypress:run
```

This runs tests in headless mode and outputs results to terminal.

### Prerequisites

Before running tests, ensure:

1. **Both servers are running**:
   ```bash
   npm start  # Starts both frontend (5173) and backend (4000)
   ```

2. **Database is set up**: The test will automatically create test users as needed.

## Test Data

### Test User

The tests use a predefined test user:
- **Email**: `test@blueprint.com`
- **Name**: `Test User`
- **Role**: `Admin`
- **Subscription**: `active`
- **Onboarding**: `completed`

### Fixtures

Test data is stored in `cypress/fixtures/testData.json` for easy maintenance and expansion.

## Best Practices Implemented

### 1. Robust Element Selection

Tests use multiple selectors for resilience:
```javascript
cy.get('[data-testid="login-button"], button:contains("Log In"), a:contains("Log In")')
```

### 2. Conditional Logic

Tests adapt to different application states:
```javascript
cy.get('body').then(($body) => {
  if ($body.find('[data-testid="user-profile"]').length > 0) {
    // Handle dashboard state
  } else if ($body.find('h1:contains("Welcome")').length > 0) {
    // Handle onboarding state
  }
});
```

### 3. API Verification

Tests verify both UI state and backend state:
```javascript
// UI verification
cy.contains('Test User').should('be.visible');

// API verification
cy.request('/api/me').should('have.property', 'status', 200);
```

### 4. Clean State Management

Each test starts with clean state:
```javascript
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
```

## Extending Tests

### Adding New Test Files

Create new test files in `cypress/e2e/` following the pattern:
```javascript
// cypress/e2e/feature-name.cy.js
describe('Feature Name', () => {
  beforeEach(() => {
    cy.login(); // Use programmatic login
    cy.visit('/feature-path');
  });

  it('should perform feature action', () => {
    // Test implementation
  });
});
```

### Adding Custom Commands

Add new commands to `cypress/support/commands.js`:
```javascript
Cypress.Commands.add('createProject', (projectData) => {
  cy.request('POST', '/api/projects', projectData);
});
```

### Adding Test Data

Update `cypress/fixtures/testData.json` with new test data objects.

## Troubleshooting

### Common Issues

1. **Tests failing due to timing**: Increase timeouts in selectors
2. **Authentication issues**: Verify test login endpoint is working
3. **Element not found**: Add more robust selectors with fallbacks

### Debug Mode

Run with debug output:
```bash
DEBUG=cypress:* npm run cypress:run
```

### Test Server Status

Verify servers are running:
```bash
curl http://localhost:4000/api/test  # Backend
curl http://localhost:5173           # Frontend
```

## Future Enhancements

Potential additions to the test suite:
- Project management flow tests
- Quote creation and management tests
- Team invitation and management tests
- Subscription lifecycle tests
- File upload and AI analysis tests
- Responsive design tests

## Security Note

The test login endpoint (`/api/test/login`) should only be used in development/testing environments. In production, this endpoint should be disabled or protected.