// cypress/support/e2e.js
// This file is processed and loaded automatically before your test files.

import './commands.js'

// You can also include any global before/after hooks here
beforeEach(() => {
  // Set up any global test state if needed
  cy.clearLocalStorage();
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  console.log('Uncaught exception:', err.message);
  return false;
});