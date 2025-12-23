describe('Client login flow', () => {
  it('logs in and redirects after submit', () => {
    // Adjust URL if your dev server differs
    cy.visit('http://localhost:5173/login');

    cy.get('input[name="email"]').type('admin@gmail.com');
    cy.get('input[name="password"]').type('admin');
    cy.get('button[type="submit"]').click();

    // Expect redirect to client home/dashboard; update the path if your app differs
    cy.url().should('include', '/');
  });
});
