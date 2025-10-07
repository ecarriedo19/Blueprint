// cypress/support/commands.js

/**
 * Programmatic login command for E2E testing
 * This bypasses the Google OAuth UI and directly creates a user session
 */
Cypress.Commands.add('login', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:4000';
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/test/login`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}: ${response.body?.error || 'Unknown error'}`);
    }
    
    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('user');
    expect(response.body.user).to.have.property('email', 'test@blueprint.com');
    
    // Log successful login for debugging
    cy.log('✅ Programmatic login successful for test user');
    
    // The session cookie should now be set automatically by the server
    // We can verify this by checking that subsequent requests are authenticated
    cy.getCookies().should('have.length.greaterThan', 0);
  });
});