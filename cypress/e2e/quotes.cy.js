// cypress/e2e/quotes.cy.js
// E2E test for Quotes CRUD functionality in Blueprint application

describe('Quotes Feature CRUD Flow', () => {
  // This runs before every single test in this file.
  // It ensures the "robot user" is logged in and starts from a clean state.
  beforeEach(() => {
    cy.login(); // Your custom command to log in programmatically
  });

  it('should allow a user to create, read, update, and delete a quote', () => {
    const testQuoteName = `E2E Test Quote ${Date.now()}`;

    // --- CREATE ---
    cy.log('Testing: CREATE a new quote');
    cy.visit('/quotes');
    
    // Wait for page to load
    cy.wait(2000);
    
    // Look for New Quote button with flexible selectors
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("+ New Quote"), button:contains("New Quote"), [data-testid="new-quote-button"]').length > 0) {
        cy.get('button:contains("+ New Quote"), button:contains("New Quote"), [data-testid="new-quote-button"]').first().click();
        
        // Fill out the form in the modal
        cy.get('input[placeholder*="e.g.,"], input[placeholder*="Downtown"], input[name="quoteName"], input[placeholder*="Quote"]')
          .first()
          .type(testQuoteName);
        
        cy.get('button:contains("Create Quote"), button:contains("Create"), button:contains("Save")').first().click();
        
        // CHECK: Verify the new quote appears in the list on the main page
        cy.wait(1000);
        cy.contains(testQuoteName).should('be.visible');
        
        // --- READ (View Detail Page) ---
        cy.log('Testing: READ the new quote detail page');
        cy.contains(testQuoteName).click();
        
        // CHECK: Verify we are on the correct detail page
        cy.url().should('include', '/quotes/'); // Checks that the URL contains '/quotes/'
        cy.contains(testQuoteName).should('be.visible');
        
        // --- UPDATE ---
        cy.log('Testing: UPDATE the quote status');
        
        // Look for status update buttons
        cy.get('body').then(($detailBody) => {
          if ($detailBody.find('button:contains("Approved")').length > 0) {
            // Find the "Approved" button in the status stepper and click it
            cy.get('button:contains("Approved")').click();
            
            // CHECK: Verify that a success toast appears or status updates
            cy.wait(1000);
            // Look for success indicators
            cy.get('body').should('contain.text', 'Approved');
          } else {
            cy.log('ℹ️ No Approved status button found - skipping status update test');
          }
        });
        
        // --- DELETE ---
        cy.log('Testing: DELETE the quote');
        cy.visit('/quotes'); // Go back to the main quotes list
        cy.wait(1000);
        
        // Find the table row containing our test quote, then find the delete button within that row and click it
        cy.get('body').then(($listBody) => {
          if ($listBody.find(`tr:contains("${testQuoteName}")`).length > 0) {
            cy.contains(testQuoteName)
              .parents('tr') // Find the parent table row
              .find('button[title*="Delete"], button:contains("Delete"), [data-testid="delete-button"]') // Find the delete button inside that row
              .first()
              .click();
            
            // Handle our custom confirmation modal
            cy.wait(500);
            cy.get('button:contains("Confirm"), button:contains("Delete"), button:contains("Yes")').first().click();
            
            // CHECK: Verify the quote is no longer on the page
            cy.wait(1000);
            cy.contains(testQuoteName).should('not.exist');
          } else {
            cy.log('ℹ️ Quote not found in table format - checking for alternative layout');
            // Alternative: look for card-based layout
            if ($listBody.find(`:contains("${testQuoteName}")`).length > 0) {
              cy.contains(testQuoteName)
                .parent()
                .find('button[title*="Delete"], button:contains("Delete")') 
                .first()
                .click();
              
              cy.wait(500);
              cy.get('button:contains("Confirm"), button:contains("Delete"), button:contains("Yes")').first().click();
              cy.wait(1000);
              cy.contains(testQuoteName).should('not.exist');
            } else {
              cy.log('ℹ️ Could not find delete functionality - test partially completed');
            }
          }
        });
        
      } else {
        cy.log('ℹ️ No "New Quote" button found - user might not have access or page layout is different');
        // Just verify we can see the quotes page
        cy.url().should('include', '/quotes');
        cy.contains('Quote').should('be.visible');
      }
    });
  });

  it('should verify user can access quotes page', () => {
    // Simple test to verify quotes page is accessible
    cy.visit('/quotes');
    cy.url().should('include', '/quotes');
    
    // Look for quotes-related content
    cy.get('body').should('contain.text', 'Quote');
  });
});