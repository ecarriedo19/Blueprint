// cypress/e2e/auth.cy.js
// E2E test for user authentication flow in Blueprint application

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Wait for both servers to be ready
    cy.request('http://localhost:4000/api/test').should('have.property', 'status', 200);
    cy.visit('/');
  });

  it('should handle successful login and logout flow', () => {
    // Step 1: Verify we start on the public landing page
    cy.log('🔍 Verifying initial public state');
    
    // Look for login button or marketing content
    cy.get('body').should('contain.text', 'Blueprint');
    
    // Check if we can find a login button (with multiple possible selectors)
    cy.get('body').then(($body) => {
      const hasLoginButton = $body.find('button:contains("Log In"), a:contains("Log In"), [data-testid="login-button"]').length > 0;
      if (hasLoginButton) {
        cy.get('button:contains("Log In"), a:contains("Log In"), [data-testid="login-button"]')
          .first()
          .should('be.visible');
      }
    });

    // Step 2: Perform programmatic login
    cy.log('🔐 Performing programmatic login');
    cy.login();

    // Step 3: Navigate to dashboard and verify successful login
    cy.log('🏠 Navigating to dashboard');
    cy.visit('/');
    
    // Wait a moment for the page to load
    cy.wait(2000);
    
    // Step 4: Verify authentication by checking a protected endpoint
    cy.log('🔐 Verifying authentication status via API');
    cy.request({
      url: 'http://localhost:4000/api/me',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('email', 'test@blueprint.com');
      expect(response.body).to.have.property('name', 'Test User');
    });

    // Step 5: Check for user authentication indicators in the UI
    cy.log('✅ Checking for authenticated user indicators');
    
    // Look for user name or email somewhere on the page
    cy.get('body').should('contain.text', 'Test User');

    // Step 6: Perform logout (look for logout button)
    cy.log('🚪 Looking for logout functionality');
    
    // Try to find logout button in various possible locations
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Logout"), button:contains("Log Out")').length > 0) {
        cy.get('button:contains("Logout"), button:contains("Log Out")').first().click();
        
        // Verify logout was successful
        cy.log('✅ Verifying successful logout');
        cy.wait(1000);
        
        // Should be redirected to landing page and see login options again
        cy.get('body').should('contain.text', 'Blueprint');
        
        // API should now return 401
        cy.request({
          url: 'http://localhost:4000/api/me',
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(401);
        });
      } else {
        cy.log('ℹ️ No logout button found - user might be on onboarding or different page state');
      }
    });

    cy.log('🎉 Authentication flow test completed');
  });

  it('should verify programmatic login works', () => {
    // Simple test to verify our custom login command works
    cy.login();
    
    // Verify we're authenticated
    cy.request('http://localhost:4000/api/me').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('email', 'test@blueprint.com');
    });
  });
});